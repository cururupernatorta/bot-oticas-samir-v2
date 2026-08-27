/**
 * Testes de compliance — as funções puras que decidem se o agente pode falar.
 * As que tocam Mongo são testadas em integração.
 */
const assert = require('assert');
const { detectaOptOut, agoraLocal, dentroDaJanela, rodapeOptOut } = require('../src/agente/compliance');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

// ── detectaOptOut ───────────────────────────────────────────────────
const deveDetectar = [
  'não quero receber isso',
  'NAO QUERO',
  'pare de me mandar mensagem',
  'me descadastra por favor',
  'quero sair da lista',
  'SAIR',                     // não está na lista literal — ver teste abaixo
  'não tenho interesse',
  'isso é spam',
  'me tira daí',
  'stop',
  'cancelar',
  'não me mande mais nada'
];

teste('detecta as frases de recusa mais comuns', () => {
  const falhou = deveDetectar.filter(f => !detectaOptOut(f));
  assert.strictEqual(falhou.length, 0, 'não detectou: ' + JSON.stringify(falhou));
});

teste('detecta a palavra que o próprio rodapé manda responder', () => {
  // O rodapé diz: responda "SAIR". Se isto falhar, o opt-out é uma promessa falsa.
  assert.ok(detectaOptOut('SAIR'), '"SAIR" isolado precisa ser opt-out');
  assert.ok(detectaOptOut('sair'));
  assert.ok(detectaOptOut('Sair.'));
  assert.ok(detectaOptOut('  SAIR  '));
});

teste('palavra curta isolada não vaza para dentro de frase comum', () => {
  // "sair" dentro de frase normal NÃO é recusa — evita opt-out falso-positivo
  assert.ok(!detectaOptOut('vou sair agora, me chama mais tarde'));
  assert.ok(!detectaOptOut('posso sair do plano depois se não gostar?'));
});

teste('é case-insensitive', () => {
  assert.ok(detectaOptOut('NÃO QUERO'));
  assert.ok(detectaOptOut('Não Quero'));
});

teste('detecta dentro de frase maior', () => {
  assert.ok(detectaOptOut('oi, obrigado mas não tenho interesse no momento, abraço'));
});

teste('não dispara em resposta positiva', () => {
  assert.ok(!detectaOptOut('opa, quero sim! me manda mais detalhes'));
  assert.ok(!detectaOptOut('quanto custa?'));
  assert.ok(!detectaOptOut('pode me ligar amanhã'));
});

teste('não quebra com vazio ou nulo', () => {
  assert.strictEqual(detectaOptOut(''), false);
  assert.strictEqual(detectaOptOut(null), false);
  assert.strictEqual(detectaOptOut(undefined), false);
});

// ── janela de contato ───────────────────────────────────────────────
teste('agoraLocal devolve hora e dia válidos', () => {
  const { hora, diaSemana } = agoraLocal();
  assert.ok(Number.isInteger(hora) && hora >= 0 && hora <= 23, 'hora inválida: ' + hora);
  assert.ok(Number.isInteger(diaSemana) && diaSemana >= 0 && diaSemana <= 6, 'dia inválido: ' + diaSemana);
});

teste('agoraLocal usa America/Sao_Paulo, não o fuso do servidor', () => {
  // Render roda em UTC. Se a conversão não funcionasse, hora local == hora UTC.
  const utcHora = new Date().getUTCHours();
  const { hora } = agoraLocal();
  const difEsperada = [3, 2];  // BRT = UTC-3 (ou -2 em horário de verão)
  const dif = (utcHora - hora + 24) % 24;
  assert.ok(difEsperada.includes(dif), 'diferença UTC→BRT inesperada: ' + dif + 'h');
});

teste('dentroDaJanela devolve booleano', () => {
  assert.strictEqual(typeof dentroDaJanela(), 'boolean');
});

// ── rodapé LGPD ─────────────────────────────────────────────────────
teste('rodapé de opt-out sempre oferece saída explícita', () => {
  const r = rodapeOptOut();
  assert.ok(r.toUpperCase().includes('SAIR'), 'rodapé precisa da palavra de saída');
  assert.ok(r.length > 20, 'rodapé curto demais para ser claro');
});

let ok = 0, falhas = 0;
for (const t of testes) {
  try { t.fn(); console.log('  ✓ ' + t.nome); ok++; }
  catch (err) { console.log('  ✗ ' + t.nome + '\n      ' + err.message); falhas++; }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
