const { getDB } = require('../config/database');
const { enviarWhatsApp, enviarBotao } = require('./zapiService');
const { chamarClaude, gerarResumoLead } = require('./claudeService');
const { gerarSystemPrompt, gerarContextoAtual } = require('../utils/systemPrompt');
const { buscarFaq } = require('../utils/faq');
const { criarLead, assumirLead } = require('../models/Lead');
const { registrarMensagem, registrarTokens } = require('../models/Uso');
const { calcularCusto } = require('../utils/custoTokens');
const {
  formatarTelefone, horarioLocal,
  unidadeEstaAberta, horarioDaUnidade, unidadesAbertas, unidadeAleatoria, proximaAbertura,
  filtrarMensagemSimples, tratarTipoMensagem, trialExpirado
} = require('../utils/helpers');

const CONV = 'conversations';
const STATS = 'stats';
const SESSION_TTL = 24 * 60 * 60 * 1000;
const MAX_HISTORY = 8;

// Marcadores: aceita o novo [UNIDADE:n] e o legado [FILIAL:n].
const RE_UNIDADE = /\[(?:UNIDADE|FILIAL):(\w+)\]/i;
const RE_LIMPEZA = /\[(?:UNIDADE|FILIAL):\w+\]|\[LEAD_PRONTO\]|\[HUMANO\]|\[AVISO_HORARIO\]/gi;

async function getSession(clientId, phone) {
  const db = getDB();
  const key = `${clientId}:${phone}`;
  let s = await db.collection(CONV).findOne({ key });

  if (!s) {
    s = {
      key, clientId, phone, history: [], humanMode: false, leadNotificado: false,
      unidadeKey: null, lojaEscolhida: null, primeiraVez: true,
      createdAt: new Date(), updatedAt: new Date()
    };
    await db.collection(CONV).insertOne(s);
    return s;
  }

  const agora = new Date();
  if (s.updatedAt && (agora - new Date(s.updatedAt)) > SESSION_TTL) {
    const reset = { history: [], humanMode: false, leadNotificado: false, unidadeKey: null, lojaEscolhida: null, primeiraVez: false, updatedAt: agora };
    Object.assign(s, reset);
    await db.collection(CONV).updateOne({ key }, { $set: reset });
  }
  return s;
}

async function updateSession(key, updates) {
  await getDB().collection(CONV).updateOne({ key }, { $set: { ...updates, updatedAt: new Date() } });
}

async function incrementStatsCampo(clientId, campo, valor = 1) {
  const hoje = new Date().toISOString().split('T')[0];
  await getDB().collection(STATS).updateOne(
    { clientId, data: hoje },
    { $inc: { [campo]: valor }, $setOnInsert: { clientId, data: hoje } },
    { upsert: true }
  );
}

/** Nenhuma unidade aberta agora = atendimento que só existe por causa do bot. */
function foraDoHorario(cliente) {
  if (cliente.sempreAberto) return false;
  const unidades = cliente.lojas || {};
  if (!Object.keys(unidades).length) return false;
  return unidadesAbertas(unidades, cliente).length === 0;
}

async function registrarAtendimento(cliente, usage = null) {
  const { clientId, limiteMensagens } = cliente;

  await incrementStatsCampo(clientId, 'mensagensEnviadas');
  if (foraDoHorario(cliente)) await incrementStatsCampo(clientId, 'mensagensForaHorario');

  const { excedeu, totalNoMes } = await registrarMensagem(clientId, limiteMensagens || 8000);
  if (excedeu) {
    await incrementStatsCampo(clientId, 'mensagensExcedentes');
    console.log(`[LIMITE] ${clientId} acima do limite (${limiteMensagens}) — total no mês: ${totalNoMes}`);
  }

  if (usage) {
    const custo = calcularCusto(usage);
    await incrementStatsCampo(clientId, 'inputTokens', usage.input_tokens || 0);
    await incrementStatsCampo(clientId, 'outputTokens', usage.output_tokens || 0);
    await incrementStatsCampo(clientId, 'custoIA', custo);
    await registrarTokens(clientId, usage.input_tokens || 0, usage.output_tokens || 0, custo);
  }

  return { excedeu };
}

function extrairMensagem(body) {
  if (body.audio) return { tipo: 'audio', message: '[ÁUDIO]' };
  if (body.image) return { tipo: 'imagem', message: '[IMAGEM]' };
  if (body.document) return { tipo: 'documento', message: '[DOCUMENTO]' };
  if (body.sticker) return { tipo: 'figurinha', message: '[FIGURINHA]' };
  const texto = body.text?.message || body.buttonsResponseMessage?.message || body.listResponseMessage?.title || '';
  return { tipo: texto.trim() ? 'texto' : 'vazio', message: texto };
}

async function processarMensagem(cliente, body) {
  const { clientId, zapiInstanceId, zapiToken, nomeEmpresa, nomeBot, lojas } = cliente;

  if (body.fromMe || body.isGroup) return;

  const phone = body.phone;
  const key = `${clientId}:${phone}`;

  if (trialExpirado(cliente)) {
    await enviarWhatsApp(zapiInstanceId, zapiToken, phone,
      'Olá! Seu período de teste encerrou. Entre em contato com nossa equipe para ativar seu plano. 😊');
    return;
  }

  const { tipo, message } = extrairMensagem(body);
  console.log(`[${clientId}] ${phone} → ${tipo}: "${message.substring(0, 80)}"`);

  const session = await getSession(clientId, phone);

  if (session.humanMode) {
    console.log(`[HUMAN MODE] ${key} — bot silenciado`);
    await updateSession(key, {});
    return;
  }

  const temHistorico = (session.history || []).length > 0;

  if (session.primeiraVez) {
    await enviarWhatsApp(zapiInstanceId, zapiToken, phone,
      `Oi! Sou a ${nomeBot}, assistente virtual da ${nomeEmpresa}. Posso te ajudar com informações e já adiantar seu atendimento. Como posso ajudar? 😊`);
    await updateSession(key, { primeiraVez: false });
    await registrarAtendimento(cliente);
    // Se a pessoa só cumprimentou, a boas-vindas já respondeu tudo.
    if (filtrarMensagemSimples(message, nomeBot, nomeEmpresa, false).isSimple) return;
  }

  const porTipo = tratarTipoMensagem(tipo);
  if (porTipo) {
    if (porTipo.fixedReply) {
      await enviarWhatsApp(zapiInstanceId, zapiToken, phone, porTipo.fixedReply);
      await registrarAtendimento(cliente);
    }
    return;
  }
  if (tipo === 'vazio') return;

  // 1) FAQ — resposta instantânea, custo zero de IA.
  const hit = buscarFaq(message, cliente.faq);
  if (hit && !/^\[preencher/i.test(hit.item.resposta.trim())) {
    await enviarWhatsApp(zapiInstanceId, zapiToken, phone, hit.item.resposta);
    await incrementStatsCampo(clientId, 'respostasFaq');
    await registrarAtendimento(cliente);
    console.log(`[FAQ] ${key} → "${hit.item.pergunta}" (${hit.nota.toFixed(2)})`);
    return;
  }

  // 2) Saudação / agradecimento / emoji — também sem custo de IA.
  const simples = filtrarMensagemSimples(message, nomeBot, nomeEmpresa, temHistorico);
  if (simples.isSimple) {
    if (simples.fixedReply) {
      await enviarWhatsApp(zapiInstanceId, zapiToken, phone, simples.fixedReply);
      await registrarAtendimento(cliente);
    }
    return;
  }

  // 3) IA.
  let history = (session.history || []).concat({ role: 'user', content: message });
  if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

  // O histórico guardado fica limpo. O contexto volátil (que unidade está
  // aberta agora, data/hora) entra só na ÚLTIMA mensagem, depois do breakpoint
  // de cache — assim ele muda a cada requisição sem invalidar o prefixo.
  const paraEnvio = history.map((h, i) =>
    i === history.length - 1 && h.role === 'user'
      ? { role: 'user', content: `${gerarContextoAtual(cliente)}\n\n${h.content}` }
      : h
  );

  let rawReply, usage;
  try {
    const resposta = await chamarClaude(gerarSystemPrompt(cliente), paraEnvio);
    rawReply = resposta.texto;
    usage = resposta.usage;
  } catch (err) {
    console.error(`[IA ERRO] ${key}:`, err.message);
    await enviarWhatsApp(zapiInstanceId, zapiToken, phone,
      'Oi! Estamos com uma instabilidade técnica no momento. Já avisei nossa equipe — em instantes alguém te responde por aqui. 😊');
    await notificarFalha(cliente, phone, message);
    return;
  }

  const mUnidade = rawReply.match(RE_UNIDADE);
  const unidadeKey = mUnidade && lojas[mUnidade[1]] ? mUnidade[1] : (session.unidadeKey || null);
  const unidade = unidadeKey ? lojas[unidadeKey] : null;
  const leadPronto = /\[LEAD_PRONTO\]/i.test(rawReply);
  const pedirHumano = /\[HUMANO\]/i.test(rawReply);
  const avisoHorario = /\[AVISO_HORARIO\]/i.test(rawReply);

  let reply = rawReply.replace(RE_LIMPEZA, '').replace(/\n{3,}/g, '\n\n').trim();
  if (!reply) reply = 'Certo! Me conta um pouco mais para eu te ajudar direitinho. 😊';

  if (avisoHorario && unidade && !unidadeEstaAberta(unidade, cliente)) {
    reply += `\n\n💡 A unidade ${unidade.nome} está fechada agora (${horarioDaUnidade(unidade, cliente)}). Reabrimos ${proximaAbertura(unidade, cliente)} e alguém já entra em contato.`;
  }

  history = history.concat({ role: 'assistant', content: reply });
  if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

  await enviarWhatsApp(zapiInstanceId, zapiToken, phone, reply);
  await registrarAtendimento(cliente, usage);
  await updateSession(key, { history, unidadeKey, lojaEscolhida: unidade });

  if (pedirHumano) await handleModoHumano(cliente, phone, unidade, history);

  if (leadPronto && !session.leadNotificado && unidade) {
    await notificarEquipe(cliente, phone, unidadeKey, unidade, history);
    await updateSession(key, { leadNotificado: true });
  }

  console.log(`[${clientId}] ${phone} ← resposta enviada`);
}

/** Escolhe para quem mandar o alerta quando não há unidade definida. */
function destinatarios(cliente, unidade) {
  if (unidade) return [unidade];
  const abertas = unidadesAbertas(cliente.lojas || {}, cliente);
  if (abertas.length) return abertas;
  const qualquer = unidadeAleatoria(cliente.lojas || {});
  return qualquer ? [qualquer] : [];
}

async function handleModoHumano(cliente, phone, unidade, history) {
  const { clientId, zapiInstanceId, zapiToken, nomeEmpresa } = cliente;
  console.log(`[HUMANO] ${clientId}:${phone}`);

  const historicoTexto = history.map(h => `${h.role === 'user' ? '👤 Cliente' : '🤖 Bot'}: ${h.content}`).join('\n');

  for (const destino of destinatarios(cliente, unidade)) {
    if (!destino.whatsapp) continue;
    await enviarWhatsApp(zapiInstanceId, zapiToken, destino.whatsapp,
`🙋 *ATENDIMENTO HUMANO — ${nomeEmpresa}*

👤 *Cliente:* ${formatarTelefone(phone)}
📍 *Unidade:* ${unidade ? unidade.nome : 'não informada'}
⏰ *Horário:* ${horarioLocal(cliente)}

💬 *Conversa:*
${historicoTexto.substring(0, 800)}

👉 Entre em contato pelo WhatsApp assim que possível.`);
  }

  let aviso = 'Vou te passar para um de nossos atendentes. ';
  if (unidade && !unidadeEstaAberta(unidade, cliente)) {
    aviso += `A unidade ${unidade.nome} está fechada agora (${horarioDaUnidade(unidade, cliente)}), mas reabrimos ${proximaAbertura(unidade, cliente)} e alguém entra em contato. 😊`;
  } else {
    aviso += 'Alguém do time entra em contato com você em breve! 😊';
  }
  await enviarWhatsApp(zapiInstanceId, zapiToken, phone, aviso);
  await incrementStatsCampo(clientId, 'pedidosHumano');
}

async function notificarEquipe(cliente, phone, unidadeKey, unidade, history) {
  const { clientId, zapiInstanceId, zapiToken, nomeEmpresa } = cliente;

  if (!unidade || !unidade.whatsapp) {
    console.warn(`[LEAD] ${clientId}:${phone} — unidade sem WhatsApp cadastrado`);
    return;
  }

  const historicoTexto = history.map(h => `${h.role === 'user' ? '👤 Cliente' : '🤖 Bot'}: ${h.content}`).join('\n');

  try {
    const { texto: resumo, usage } = await gerarResumoLead(cliente, historicoTexto);
    if (usage) {
      const custo = calcularCusto(usage);
      await incrementStatsCampo(clientId, 'inputTokens', usage.input_tokens || 0);
      await incrementStatsCampo(clientId, 'outputTokens', usage.output_tokens || 0);
      await incrementStatsCampo(clientId, 'custoIA', custo);
      await registrarTokens(clientId, usage.input_tokens || 0, usage.output_tokens || 0, custo);
    }

    const aberta = unidadeEstaAberta(unidade, cliente);
    const msg =
`🆕 *NOVA OPORTUNIDADE — ${nomeEmpresa}*

👤 *Cliente:* ${formatarTelefone(phone)}
📍 *Unidade:* ${unidade.nome}${unidade.endereco ? `\n🗺️ ${unidade.endereco}` : ''}
⏰ *Recebido:* ${horarioLocal(cliente)}
${aberta ? '🟢 ABERTA' : '🔴 FECHADA'} | ${horarioDaUnidade(unidade, cliente)}

📋 *Resumo:*
${resumo}

━━━━━━━━━━━━━━
💬 *Histórico:*
${historicoTexto}`;

    await criarLead(clientId, phone, unidadeKey || '', unidade.nome, resumo, historicoTexto);
    await enviarBotao(zapiInstanceId, zapiToken, unidade.whatsapp, msg, [
      { id: montarButtonId(clientId, phone), label: '✅ Assumir Atendimento' }
    ]);

    await incrementStatsCampo(clientId, 'leadsGerados');
    console.log(`[LEAD] ${clientId}:${phone} → ${unidade.nome}`);
  } catch (err) {
    console.error(`[LEAD ERRO] ${clientId}:${phone}:`, err.message);
  }
}

/** Avisa a equipe quando a IA falha, para ninguém ficar sem resposta. */
async function notificarFalha(cliente, phone, mensagem) {
  const destino = destinatarios(cliente, null)[0];
  if (!destino?.whatsapp) return;
  await enviarWhatsApp(cliente.zapiInstanceId, cliente.zapiToken, destino.whatsapp,
`⚠️ *ATENDIMENTO PENDENTE — ${cliente.nomeEmpresa}*

O assistente não conseguiu responder este cliente:
👤 ${formatarTelefone(phone)}
💬 "${String(mensagem).substring(0, 200)}"

Por favor, responda manualmente.`);
}

// buttonId usa "|" como separador para não quebrar com clientId/telefone contendo "_".
function montarButtonId(clientId, phone) {
  return `assumir|${clientId}|${phone}`;
}

function lerButtonId(buttonId = '') {
  if (buttonId.includes('|')) {
    const [acao, clientId, phone] = buttonId.split('|');
    return acao === 'assumir' && clientId && phone ? { clientId, phone } : null;
  }
  // Formato legado: assumir_<clientId>_<phone> (clientId pode conter "_").
  const partes = buttonId.split('_');
  if (partes[0] !== 'assumir' || partes.length < 3) return null;
  return { clientId: partes.slice(1, -1).join('_'), phone: partes[partes.length - 1] };
}

async function processarBotao(cliente, body) {
  const alvo = lerButtonId(body.buttonId || '');
  if (!alvo || alvo.clientId !== cliente.clientId) return;

  const vendedorPhone = body.phone;
  await assumirLead(cliente.clientId, alvo.phone, vendedorPhone);
  await enviarWhatsApp(cliente.zapiInstanceId, cliente.zapiToken, vendedorPhone,
    `✅ *Atendimento assumido*\n\n👤 ${formatarTelefone(alvo.phone)}\n🏢 ${cliente.nomeEmpresa}\n\nResponsável: ${formatarTelefone(vendedorPhone)}`);

  console.log(`[BOTÃO] Lead ${alvo.phone} assumido por ${vendedorPhone}`);
}

module.exports = { processarMensagem, processarBotao, lerButtonId, montarButtonId, foraDoHorario };
