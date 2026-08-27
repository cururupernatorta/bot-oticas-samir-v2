/**
 * Testes do portão de qualidade — cada checagem existe por causa de uma
 * reclamação real que derruba avaliação de freelancer.
 */
const assert = require('assert');
const { verificar, extrairNumeros, extrairIdentificadores } = require('../src/estudio/qa');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

const ORIGINAL = `A loja abriu em 2019 e hoje atende 340 clientes por mês.

Fale com a gente pelo site https://exemplo.com.br ou pelo e-mail contato@exemplo.com.br. Atendemos de segunda a sábado.

Nosso índice de satisfação é de 92%.`;

// ── Extratores ──────────────────────────────────────────────────────
teste('extrai números incluindo percentuais', () => {
  const n = extrairNumeros('Subiu 12% em 2024, de 340 para 1.200 unidades.');
  assert.ok(n.some(x => x.includes('12')), 'perdeu 12%');
  assert.ok(n.some(x => x.includes('2024')), 'perdeu 2024');
  assert.ok(n.some(x => x.includes('340')), 'perdeu 340');
});

teste('extrai URL, e-mail e perfil', () => {
  const ids = extrairIdentificadores('Veja https://a.com, escreva para x@y.com.br ou siga @minhaloja');
  assert.ok(ids.some(i => i.startsWith('https://')), 'perdeu URL');
  assert.ok(ids.some(i => i.includes('@y.com.br')), 'perdeu e-mail');
  assert.ok(ids.some(i => i === '@minhaloja'), 'perdeu perfil');
});

// ── Bloqueios ───────────────────────────────────────────────────────
teste('bloqueia texto revisado vazio', () => {
  const r = verificar(ORIGINAL, '');
  assert.strictEqual(r.aprovado, false);
  assert.ok(r.alertas.some(a => a.nivel === 'bloqueio'));
});

teste('bloqueia número inventado — o erro mais caro da revisão com IA', () => {
  const comInvencao = ORIGINAL.replace('340 clientes', '890 clientes');
  const r = verificar(ORIGINAL, comInvencao);
  assert.strictEqual(r.aprovado, false, 'deveria bloquear');
  assert.ok(r.alertas.some(a => a.mensagem.includes('890')), 'deveria citar o número inventado');
});

teste('bloqueia link removido', () => {
  const semLink = ORIGINAL.replace('https://exemplo.com.br', 'nosso site');
  const r = verificar(ORIGINAL, semLink);
  assert.strictEqual(r.aprovado, false);
  assert.ok(r.alertas.some(a => a.mensagem.toLowerCase().includes('link')));
});

teste('bloqueia truncamento severo', () => {
  const r = verificar(ORIGINAL, 'A loja abriu em 2019.');
  assert.strictEqual(r.aprovado, false);
  assert.ok(r.alertas.some(a => a.nivel === 'bloqueio'));
});

// ── Aprovações ──────────────────────────────────────────────────────
teste('aprova revisão legítima que preserva fatos', () => {
  const bom = `A loja abriu em 2019. Hoje atende 340 clientes por mês.

Fale com a gente pelo site https://exemplo.com.br ou pelo e-mail contato@exemplo.com.br. Abrimos de segunda a sábado.

Nosso índice de satisfação é de 92%.`;
  const r = verificar(ORIGINAL, bom);
  assert.strictEqual(r.aprovado, true, 'bloqueios: ' + JSON.stringify(r.alertas));
});

teste('avisa quando quase nada mudou — não cobre por revisão fantasma', () => {
  const r = verificar(ORIGINAL, ORIGINAL);
  assert.ok(r.alertas.some(a => a.mensagem.toLowerCase().includes('quase nada')));
});

teste('número reformatado com separador de milhar não conta como invenção', () => {
  const a = 'Vendemos 1.200 unidades.';
  const b = 'Vendemos 1200 unidades no período.';
  const r = verificar(a, b);
  assert.ok(!r.alertas.some(x => x.nivel === 'bloqueio' && x.mensagem.includes('1200')),
    'separador de milhar não deveria virar bloqueio: ' + JSON.stringify(r.alertas));
});

// ── Formato da saída ────────────────────────────────────────────────
teste('devolve toda checagem com nome, resultado e detalhe', () => {
  const r = verificar(ORIGINAL, ORIGINAL.replace('atende', 'recebe'));
  assert.ok(r.checagens.length >= 5, 'poucas checagens: ' + r.checagens.length);
  for (const c of r.checagens) {
    assert.ok(c.nome, 'checagem sem nome');
    assert.strictEqual(typeof c.passou, 'boolean', 'checagem sem resultado booleano');
    assert.ok(c.detalhe, 'checagem sem detalhe legível');
  }
});

teste('reporta score antes e depois', () => {
  const r = verificar(ORIGINAL, ORIGINAL.replace('atende', 'recebe'));
  assert.strictEqual(typeof r.scoreAntes, 'number');
  assert.strictEqual(typeof r.scoreDepois, 'number');
});

teste('nunca lança — falha de QA sinaliza, não derruba a entrega', () => {
  assert.doesNotThrow(() => verificar('a', 'b'));
  assert.doesNotThrow(() => verificar('texto', 'texto'));
});

let ok = 0, falhas = 0;
for (const t of testes) {
  try { t.fn(); console.log('  ✓ ' + t.nome); ok++; }
  catch (err) { console.log('  ✗ ' + t.nome + '\n      ' + err.message); falhas++; }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
