const horarios = require('./horarios');

function formatarTelefone(phone = '') {
  return String(phone).replace(/^55/, '').replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

function horarioLocal(cliente = {}) {
  return new Date().toLocaleString('pt-BR', {
    timeZone: cliente.fusoHorario || horarios.FUSO_PADRAO,
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function hojeLocal(cliente = {}) {
  return new Date().toLocaleDateString('pt-BR', { timeZone: cliente.fusoHorario || horarios.FUSO_PADRAO });
}

// ── Horários: delegado 100% ao motor orientado a dados ────────────────────────
const unidadeEstaAberta = horarios.estaAberta;
const horarioDaUnidade = horarios.descreverHorario;
const unidadesAbertas = horarios.unidadesAbertas;
const unidadeAleatoria = horarios.unidadeAleatoria;
const proximaAbertura = horarios.proximaAbertura;

// ── Atalhos sem custo de IA ───────────────────────────────────────────────────
const SAUDACOES = ['oi', 'ola', 'e ai', 'eai', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'opa'];
const AGRADECIMENTOS = ['obrigado', 'obrigada', 'obg', 'vlw', 'valeu', 'brigado', 'brigada', 'grato', 'grata'];
const DESPEDIDAS = ['tchau', 'ate logo', 'ate mais', 'falou', 'flw', 'ate breve'];
// Confirmações só valem como atalho no INÍCIO da conversa. No meio de um
// atendimento, "sim" é resposta a uma pergunta do bot e precisa ir para a IA.
const CONFIRMACOES = ['ok', 'okay', 'oki', 'sim', 'nao', 'certo', 'entendi', 'combinado', 'beleza', 'blz', 'ta', 'ta bom', 'perfeito', 'show', 'isso'];

function normalizar(texto = '') {
  return String(texto).toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * @param {boolean} temHistorico  true se já existe conversa em andamento
 */
function filtrarMensagemSimples(message, nomeBot = 'Ana', nomeEmpresa = 'a empresa', temHistorico = false) {
  const norm = normalizar(message);
  const soEmoji = /^[\p{Extended_Pictographic}\s]+$/u.test(message || '') && (message || '').trim().length <= 6;

  if (SAUDACOES.includes(norm)) {
    const parte = norm.startsWith('bom dia') ? 'Bom dia!' : norm.startsWith('boa tarde') ? 'Boa tarde!' : norm.startsWith('boa noite') ? 'Boa noite!' : 'Olá!';
    return { isSimple: true, fixedReply: `${parte} Sou a ${nomeBot}, da ${nomeEmpresa}. Como posso te ajudar hoje? 😊` };
  }
  if (AGRADECIMENTOS.includes(norm)) return { isSimple: true, fixedReply: 'Disponha! Qualquer coisa é só chamar 😊' };
  if (DESPEDIDAS.includes(norm)) return { isSimple: true, fixedReply: 'Até mais! Estamos por aqui se precisar 😊' };
  if (!temHistorico && (CONFIRMACOES.includes(norm) || soEmoji)) {
    return { isSimple: true, fixedReply: 'Estou aqui! Como posso ajudar? 😊' };
  }
  if (temHistorico && soEmoji) return { isSimple: true, fixedReply: null };

  return { isSimple: false, fixedReply: null };
}

function tratarTipoMensagem(tipo) {
  if (tipo === 'audio') return { isSimple: true, fixedReply: 'Recebi seu áudio! Pode me contar em texto o que você precisa? 😊' };
  if (tipo === 'imagem') return { isSimple: true, fixedReply: 'Recebi sua imagem! Pode me contar em texto o que você precisa? 😊' };
  if (tipo === 'documento') return { isSimple: true, fixedReply: 'Recebi seu arquivo! Pode me contar em texto o que você precisa? 😊' };
  if (tipo === 'figurinha') return { isSimple: true, fixedReply: null };
  return null;
}

function trialExpirado(cliente) {
  if (!cliente || !cliente.trialAte) return false;
  return new Date() > new Date(cliente.trialAte);
}

// ── Relatórios ────────────────────────────────────────────────────────────────
function formatarRelatorioCliente(stats, cliente) {
  const soma = campo => stats.reduce((a, s) => a + (s[campo] || 0), 0);
  const msgs = soma('mensagensEnviadas');
  const leads = soma('leadsGerados');
  const humanos = soma('pedidosHumano');
  const foraHorario = soma('mensagensForaHorario');

  return `📊 *Resumo da semana — ${cliente.nomeEmpresa}*

💬 Mensagens atendidas: ${msgs}
🆕 Oportunidades enviadas para o time: ${leads}
🙋 Pedidos de atendimento humano: ${humanos}
🌙 Atendimentos fora do horário comercial: ${foraHorario}

⏱️ Seu atendimento ficou ativo 24h. Nenhuma mensagem ficou sem resposta.`;
}

function formatarRelatorioAdmin(linhasPorCliente, totalGeral) {
  return `📊 *Relatório Semanal — Todos os Clientes*

${linhasPorCliente.join('\n\n')}

━━━━━━━━━━━━━━
💰 *Custo total de IA na semana:* R$ ${totalGeral.toFixed(2)}`;
}

module.exports = {
  formatarTelefone, horarioLocal, hojeLocal, normalizar,
  unidadeEstaAberta, horarioDaUnidade, unidadesAbertas, unidadeAleatoria, proximaAbertura,
  filtrarMensagemSimples, tratarTipoMensagem, trialExpirado,
  formatarRelatorioCliente, formatarRelatorioAdmin,
  // aliases legados (v3.1) — mantidos para não quebrar integrações existentes
  horarioBrasil: horarioLocal, hojeBrasil: hojeLocal,
  filialEstaAberta: horarios.estaAberta, horarioFilial: horarios.descreverHorario,
  filiaisAbertas: horarios.unidadesAbertas, filialAleatoria: horarios.unidadeAleatoria
};
