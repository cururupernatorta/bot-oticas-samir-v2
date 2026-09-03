require('dotenv').config();
const readline = require('readline');
const { connectDB } = require('../src/config/database');
const { createClient } = require('../src/models/Client');
const { getPlano, PLANOS } = require('../src/config/planos');
const { listarNichos, sugestoesDoNicho } = require('../src/config/nichos');
const { parseFaixa } = require('../src/utils/horarios');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

function grade(semana, sabado, domingo) {
  return { seg: semana, ter: semana, qua: semana, qui: semana, sex: semana, sab: sabado, dom: domingo };
}

async function main() {
  await connectDB();
  console.log('\n═══ ONBOARDING DE CLIENTE ═══\n');
  console.log('Preencha a Ficha de Diagnóstico (docs/comercial/ficha-diagnostico.md) com o cliente antes.\n');

  // 1. Nicho — define os padrões de tudo que vem depois
  const nichos = listarNichos();
  console.log('Nichos disponíveis:');
  nichos.forEach((n, i) => console.log(`  ${String(i + 1).padStart(2)}. ${n.emoji} ${n.nome}  (plano sugerido: ${n.planoSugerido})`));
  const escolha = await ask('\nNúmero do nicho [1]: ');
  const nicho = nichos[(parseInt(escolha, 10) || 1) - 1] || nichos[0];
  const sug = sugestoesDoNicho(nicho.id);
  console.log(`\n→ Nicho: ${nicho.emoji} ${nicho.nome}`);
  console.log(`→ Volume típico: ${nicho.volumeMensagensMes} msgs/mês\n`);

  // 2. Identificação
  const clientId = await ask('ID do cliente (slug, ex: pet-feliz): ');
  const nomeEmpresa = await ask('Nome da empresa: ');
  const nomeBot = (await ask(`Nome do bot [${sug.nomeBot}]: `)) || sug.nomeBot;
  const fusoHorario = (await ask('Fuso horário [America/Sao_Paulo]: ')) || 'America/Sao_Paulo';

  // 3. Canal
  const zapiInstanceId = await ask('Z-API Instance ID: ');
  const zapiToken = await ask('Z-API Token: ');

  // 4. Plano
  console.log(`\nPlanos: ${Object.keys(PLANOS).map(k => `${k} (R$ ${PLANOS[k].precoMensal}/${PLANOS[k].limiteMensagens} msgs)`).join(' | ')}`);
  const planoId = (await ask(`Plano [${nicho.planoSugerido}]: `)) || nicho.planoSugerido;
  const plano = getPlano(planoId);
  const limiteMensagens = parseInt(await ask(`Limite mensal [${plano.limiteMensagens}]: `), 10) || plano.limiteMensagens;
  const precoPorMensagemExcedente = parseFloat(await ask(`Excedente R$/msg [${plano.precoPorMensagemExcedente}]: `)) || plano.precoPorMensagemExcedente;
  const diasTrial = parseInt(await ask('Dias de trial (Enter = sem trial): '), 10);
  const trialAte = diasTrial ? new Date(Date.now() + diasTrial * 864e5) : null;

  // 5. Conteúdo (Enter aceita o template do nicho)
  console.log('\n— Conteúdo (Enter mantém o template do nicho) —');
  const descricao = (await ask('Descrição da empresa: ')) || sug.descricao;
  const conhecimento = (await ask('Base de conhecimento (Enter = template para preencher depois): ')) || sug.conhecimento;
  const limites = (await ask('Regras/limites (Enter = padrão do nicho): ')) || sug.limites;

  // 6. Unidades com horários estruturados
  const lojas = {};
  let i = 1;
  console.log('\n— Unidades —');
  while (true) {
    const nome = await ask(`\nUnidade ${i} — Nome (Enter para encerrar): `);
    if (!nome.trim()) break;
    const endereco = await ask('  Endereço: ');
    const whatsapp = await ask('  WhatsApp com DDI (5545999999999): ');
    const semana = parseFaixa((await ask('  Seg a Sex [08:30-18:30]: ')) || '08:30-18:30');
    const sabado = parseFaixa(await ask('  Sábado (vazio = fechado) [08:30-13:00]: ') || '08:30-13:00');
    const domingo = parseFaixa(await ask('  Domingo (vazio = fechado): '));
    lojas[i] = { nome, endereco, whatsapp, link: `https://wa.me/${whatsapp}`, horarios: grade(semana, sabado, domingo) };
    i++;
  }

  const whatsappGestor = (await ask('\nWhatsApp do gestor (recebe o relatório semanal) [1ª unidade]: ')) || null;

  const doc = await createClient({
    clientId, nomeEmpresa, nomeBot, nicho: nicho.id, fusoHorario,
    zapiInstanceId, zapiToken, whatsappGestor,
    plano: planoId, limiteMensagens, precoPorMensagemExcedente, trialAte,
    descricao, conhecimento, limites, lojas
  });

  console.log(`\n✅ "${nomeEmpresa}" criado.`);
  console.log(`🔗 Webhook Z-API: https://SEU_SERVIDOR/webhook/${clientId}`);
  console.log(`📦 Plano ${planoId} · ${limiteMensagens} msgs/mês · excedente R$ ${precoPorMensagemExcedente}/msg`);
  console.log(`🎯 Nicho ${nicho.nome} · ${doc.faq.length} FAQs e ${doc.qualificacao.length} pontos de qualificação pré-carregados`);
  console.log('\n⚠️  Próximo passo: abra /admin e preencha os campos [preencher] do conhecimento e das FAQs.');
  rl.close();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
