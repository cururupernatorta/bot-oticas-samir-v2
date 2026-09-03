/**
 * Smoke test end-to-end sem rede: valida o caminho completo de uma conversa
 * (boas-vindas → FAQ → IA → escolha de unidade → lead → botão assumir),
 * com o mesmo cliente configurado em dois nichos diferentes.
 *
 * Rodar: npm run smoke
 */
const path = require('path');
const { db } = require('./fakeDb');

// ── Stubs ────────────────────────────────────────────────────────────────────
require.cache[require.resolve('../src/config/database')] = {
  exports: { getDB: () => db, connectDB: async () => db }
};

const enviadas = [];
require.cache[require.resolve('../src/services/zapiService')] = {
  exports: {
    enviarWhatsApp: async (_i, _t, phone, message) => { enviadas.push({ phone, message, tipo: 'texto' }); },
    enviarBotao: async (_i, _t, phone, message, buttons) => { enviadas.push({ phone, message, tipo: 'botao', buttons }); }
  }
};

let respostasIA = [];
require.cache[require.resolve('../src/services/claudeService')] = {
  exports: {
    chamarClaude: async () => ({ texto: respostasIA.shift() ?? 'Certo!', usage: { input_tokens: 600, output_tokens: 180 } }),
    gerarResumoLead: async () => ({ texto: 'Cliente quer X. Urgência alta.', usage: { input_tokens: 300, output_tokens: 90 } })
  }
};

const { montarDocumento } = require('../src/models/Client');
const { processarMensagem, processarBotao, montarButtonId } = require('../src/services/botService');
const { gerarSystemPrompt } = require('../src/utils/systemPrompt');
const { listarNichos } = require('../src/config/nichos');

// ── Helpers ──────────────────────────────────────────────────────────────────
let falhas = 0, testes = 0;
function ok(nome, condicao, detalhe = '') {
  testes++;
  if (condicao) { console.log(`  ✅ ${nome}`); }
  else { falhas++; console.log(`  ❌ ${nome} ${detalhe}`); }
}
const ultima = () => enviadas[enviadas.length - 1];
const msg = texto => ({ phone: '5545999990000', text: { message: texto } });

async function conversa(cliente, textos) {
  for (const t of textos) await processarMensagem(cliente, msg(t));
}

// ── Cenário 1: pet shop ──────────────────────────────────────────────────────
async function cenarioPetshop() {
  console.log('\n▶ Pet shop (plano start, 1 unidade, FAQ preenchido)');
  const cliente = montarDocumento({
    clientId: 'pet-feliz', nomeEmpresa: 'Pet Feliz', nicho: 'petshop', plano: 'start',
    zapiInstanceId: 'i', zapiToken: 't',
    faq: [{ pergunta: 'Vocês fazem leva e traz?', resposta: 'Fazemos sim! Taxa de R$ 15 na região central.', palavrasChave: ['leva e traz', 'taxi dog', 'buscam'] }],
    lojas: { 1: { nome: 'Pet Feliz Centro', endereco: 'Rua A, 100', whatsapp: '5545911112222', sempreAberta: true } }
  });

  await processarMensagem(cliente, msg('oi'));
  ok('boas-vindas usa o nome do bot do nicho (Mel)', ultima().message.includes('Mel'), ultima().message);

  await processarMensagem(cliente, msg('vocês buscam o cachorro em casa?'));
  ok('FAQ responde sem chamar a IA', ultima().message.includes('Taxa de R$ 15'), ultima().message);

  respostasIA = ['Claro! Qual o porte do seu pet? [UNIDADE:1]', 'Perfeito, já vou passar para o time. [LEAD_PRONTO]'];
  await conversa(cliente, ['quero agendar banho e tosa', 'é um golden, porte grande, sexta de manhã']);

  const lead = enviadas.find(e => e.tipo === 'botao');
  ok('lead notificado na unidade com botão', !!lead && lead.phone === '5545911112222', JSON.stringify(lead?.phone));
  ok('marcadores removidos da resposta ao cliente', !enviadas.some(e => /\[UNIDADE:|\[LEAD_PRONTO\]/.test(e.message)));

  await processarBotao(cliente, { phone: '5545933334444', buttonId: montarButtonId('pet-feliz', '5545999990000') });
  ok('botão assumir confirma para o vendedor', ultima().message.includes('assumido'), ultima().message);

  const stats = db.collection('stats').docs.find(s => s.clientId === 'pet-feliz');
  ok('estatísticas registradas', stats.mensagensEnviadas >= 4 && stats.leadsGerados === 1 && stats.respostasFaq === 1,
     JSON.stringify({ m: stats.mensagensEnviadas, l: stats.leadsGerados, f: stats.respostasFaq }));
}

// ── Cenário 2: clínica odontológica, fora do horário ─────────────────────────
async function cenarioOdonto() {
  console.log('\n▶ Clínica odontológica (unidade fechada, pedido de humano)');
  const cliente = montarDocumento({
    clientId: 'sorriso', nomeEmpresa: 'Clínica Sorriso', nicho: 'odontologia', plano: 'pro',
    zapiInstanceId: 'i', zapiToken: 't', whatsappGestor: '5545955556666',
    lojas: { 1: { nome: 'Sorriso Centro', whatsapp: '5545955556666', horarios: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] } } }
  });

  ok('prompt usa o vocabulário do nicho (pacientes)', gerarSystemPrompt(cliente).includes('Você atende pacientes'));
  ok('prompt traz os guardrails de saúde', gerarSystemPrompt(cliente).includes('PROIBIDO dar diagnóstico'));
  ok('unidade com todos os dias vazios é tratada como fechada',
     /Status: FECHADA agora/.test(gerarSystemPrompt(cliente)),
     gerarSystemPrompt(cliente).split('\n').find(l => l.includes('Status:')) || '');

  respostasIA = ['Sinto muito pela dor. Vou acionar nossa equipe agora. [HUMANO]'];
  await processarMensagem(cliente, msg('estou com muita dor de dente'));
  await processarMensagem(cliente, msg('estou com muita dor de dente'));

  const alerta = enviadas.filter(e => e.phone === '5545955556666' && e.message.includes('ATENDIMENTO HUMANO'));
  ok('equipe é acionada mesmo com a clínica fechada', alerta.length === 1, `alertas=${alerta.length}`);

  const stats = db.collection('stats').docs.find(s => s.clientId === 'sorriso');
  ok('mensagens fora do horário são contabilizadas', stats.mensagensForaHorario > 0, JSON.stringify(stats.mensagensForaHorario));
}

// ── Cenário 3: todos os nichos geram prompt válido ───────────────────────────
function cenarioTodosNichos() {
  console.log('\n▶ Todos os pacotes de nicho');
  let quebrados = [];
  for (const n of listarNichos()) {
    const c = montarDocumento({ clientId: n.id, nomeEmpresa: 'Empresa Teste', nicho: n.id, lojas: { 1: { nome: 'Unidade 1' } } });
    const p = gerarSystemPrompt(c);
    if (!p.includes('# IDENTIDADE') || !p.includes('# REGRAS INEGOCIÁVEIS') || p.includes('undefined') || p.length < 800) {
      quebrados.push(n.id);
    }
  }
  ok(`${listarNichos().length} nichos geram prompt completo`, quebrados.length === 0, quebrados.join(', '));
}

(async () => {
  console.log('═══ SMOKE TEST — Plataforma de Atendimento 24h ═══');
  await cenarioPetshop();
  await cenarioOdonto();
  cenarioTodosNichos();
  console.log(`\n${falhas === 0 ? '✅' : '❌'} ${testes - falhas}/${testes} verificações passaram`);
  process.exit(falhas === 0 ? 0 : 1);
})();
