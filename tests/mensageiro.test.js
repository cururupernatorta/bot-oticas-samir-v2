/**
 * Testes do mensageiro — formatação e parsing. Geração via Claude é integração.
 */
const assert = require('assert');
const { truncar, extrairJson, montarProposta, LIMITE_CARACTERES } = require('../src/agente/mensageiro');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

// ── truncar ─────────────────────────────────────────────────────────
teste('não mexe em texto dentro do limite', () => {
  const t = 'Oi, tudo bem?';
  assert.strictEqual(truncar(t), t);
});

teste('corta texto longo e sinaliza com reticência', () => {
  const longo = 'palavra '.repeat(200);
  const r = truncar(longo);
  assert.ok(r.length <= LIMITE_CARACTERES + 1, 'passou do limite: ' + r.length);
  assert.ok(r.endsWith('…'), 'deveria sinalizar corte');
});

teste('não corta palavra no meio', () => {
  const r = truncar('a'.repeat(50) + ' ' + 'palavralonga '.repeat(60));
  const semReticencia = r.slice(0, -1).trim();
  assert.ok(!semReticencia.endsWith('palavralong'), 'cortou palavra pela metade');
});

teste('texto exatamente no limite passa intacto', () => {
  const exato = 'x'.repeat(LIMITE_CARACTERES);
  assert.strictEqual(truncar(exato), exato);
});

// ── extrairJson ─────────────────────────────────────────────────────
teste('lê JSON puro', () => {
  assert.deepStrictEqual(extrairJson('{"mensagem":"oi"}'), { mensagem: 'oi' });
});

teste('lê JSON embrulhado em cerca markdown — o erro mais comum de LLM', () => {
  assert.deepStrictEqual(extrairJson('```json\n{"mensagem":"oi"}\n```'), { mensagem: 'oi' });
  assert.deepStrictEqual(extrairJson('```\n{"mensagem":"oi"}\n```'), { mensagem: 'oi' });
});

teste('lê JSON com espaço e quebra de linha em volta', () => {
  assert.deepStrictEqual(extrairJson('\n\n  {"mensagem":"oi"}  \n'), { mensagem: 'oi' });
});

teste('lança em JSON inválido — falha alto, não silenciosa', () => {
  assert.throws(() => extrairJson('não sou json'));
});

// ── montarProposta ──────────────────────────────────────────────────
const prospect = { nome: 'Ótica Visão Clara', nicho: 'otica', cidade: 'Belém' };

teste('proposta traz o preço real do plano, não valor inventado', () => {
  const p = montarProposta(prospect, 'start');
  assert.ok(p.includes('R$ 900'), 'preço do Start deveria vir de config/planos.js');
  assert.ok(p.includes('3.000'), 'limite de mensagens do Start');
});

teste('plano Pro traz preço e relatório semanal', () => {
  const p = montarProposta(prospect, 'pro');
  assert.ok(p.includes('R$ 1.300'), 'preço do Pro');
  assert.ok(p.includes('Relatório semanal'), 'Pro tem relatório semanal');
});

teste('plano Start NÃO promete relatório semanal', () => {
  const p = montarProposta(prospect, 'start');
  assert.ok(!p.includes('Relatório semanal'), 'Start não tem relatório — não pode prometer');
});

teste('excedente aparece em vírgula decimal brasileira', () => {
  const p = montarProposta(prospect, 'start');
  assert.ok(p.includes('R$ 0,30'), 'formato brasileiro de moeda');
});

teste('plano inexistente cai no default sem quebrar', () => {
  const p = montarProposta(prospect, 'plano_fantasma');
  assert.ok(p.includes('R$'), 'deveria gerar proposta mesmo assim');
});

teste('proposta cita o nome da empresa', () => {
  assert.ok(montarProposta(prospect, 'start').includes('Ótica Visão Clara'));
});

let ok = 0, falhas = 0;
for (const t of testes) {
  try { t.fn(); console.log('  ✓ ' + t.nome); ok++; }
  catch (err) { console.log('  ✗ ' + t.nome + '\n      ' + err.message); falhas++; }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
