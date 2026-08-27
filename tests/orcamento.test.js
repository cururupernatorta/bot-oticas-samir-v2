/**
 * Testes de orçamento — preço errado custa mais caro que bug.
 */
const assert = require('assert');
const { orcar, recomendar, arredondar } = require('../src/estudio/orcamento');
const { contarLaudas, CARACTERES_POR_LAUDA, SERVICOS } = require('../src/estudio/config');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

const textoLongo = 'palavra '.repeat(1200); // ~9600 caracteres

// ── Lauda ───────────────────────────────────────────────────────────
teste('lauda usa o padrão brasileiro de 1.400 caracteres', () => {
  assert.strictEqual(CARACTERES_POR_LAUDA, 1400);
  assert.strictEqual(contarLaudas('x'.repeat(1400)), 1);
  assert.strictEqual(contarLaudas('x'.repeat(1401)), 2);
});

teste('texto minúsculo ainda conta como 1 lauda', () => {
  assert.strictEqual(contarLaudas('oi'), 1);
});

// ── Preço ───────────────────────────────────────────────────────────
teste('cobra por lauda acima do mínimo', () => {
  const o = orcar({ texto: textoLongo, servico: 'revisao' });
  const laudas = contarLaudas(textoLongo);
  assert.ok(o.preco >= laudas * SERVICOS.revisao.precoPorLauda * 0.95,
    `esperado ~${laudas * 9}, veio ${o.preco}`);
});

teste('aplica o mínimo em texto curto', () => {
  const o = orcar({ texto: 'texto curto', servico: 'revisao' });
  assert.ok(o.preco >= SERVICOS.revisao.minimo, 'ignorou o mínimo: ' + o.preco);
  assert.ok(o.memoria.some(m => m.includes('mínimo')), 'não registrou o mínimo na memória');
});

teste('urgência expressa dobra o preço e corta o prazo', () => {
  const normal = orcar({ texto: textoLongo, servico: 'revisao', urgencia: 'normal' });
  const expresso = orcar({ texto: textoLongo, servico: 'revisao', urgencia: 'expresso' });
  assert.ok(expresso.preco > normal.preco, 'expresso deveria custar mais');
  assert.ok(expresso.prazoHoras < normal.prazoHoras, 'expresso deveria ser mais rápido');
});

teste('material técnico custa mais que material comum', () => {
  const simples = orcar({ texto: textoLongo, servico: 'revisao', complexidade: 'simples' });
  const tecnico = orcar({ texto: textoLongo, servico: 'revisao', complexidade: 'tecnico' });
  assert.ok(tecnico.preco > simples.preco);
});

teste('preço sai sempre arredondado na dezena', () => {
  for (const u of ['normal', 'rapido', 'expresso']) {
    const o = orcar({ texto: textoLongo, servico: 'revisao', urgencia: u });
    assert.strictEqual(o.preco % 10, 0, `preço quebrado (${u}): ${o.preco}`);
  }
});

teste('arredondar nunca devolve negativo', () => {
  assert.strictEqual(arredondar(-50), 0);
});

// ── Modelos de serviço ──────────────────────────────────────────────
teste('serviço fixo ignora o tamanho do texto', () => {
  const curto = orcar({ texto: 'oi', servico: 'diagnostico' });
  const longo = orcar({ texto: textoLongo, servico: 'diagnostico' });
  assert.strictEqual(curto.preco, longo.preco);
});

teste('copy cobra por tipo de peça', () => {
  const anuncio = orcar({ servico: 'copy', peca: 'anuncio' });
  const pagina = orcar({ servico: 'copy', peca: 'pagina' });
  assert.ok(pagina.preco > anuncio.preco, 'página deveria custar mais que anúncio');
});

teste('retainer devolve valor mensal e marca recorrência', () => {
  const o = orcar({ servico: 'pacote', faixa: 'Padrão' });
  assert.strictEqual(o.recorrente, true);
  assert.ok(o.laudasInclusas > 0);
});

// ── Erros ───────────────────────────────────────────────────────────
teste('serviço desconhecido falha alto', () => {
  assert.throws(() => orcar({ texto: 'x', servico: 'inexistente' }), /desconhecido/);
});

teste('peça desconhecida falha alto', () => {
  assert.throws(() => orcar({ servico: 'copy', peca: 'inexistente' }), /peça/);
});

teste('serviço por lauda sem texto falha alto', () => {
  assert.throws(() => orcar({ servico: 'revisao' }), /texto/);
});

// ── Recomendação ────────────────────────────────────────────────────
const IA = `No cenário atual, é importante destacar que soluções robustas permitem alavancar resultados. Além disso, torna-se fundamental otimizar processos de forma meticulosa. Dessa forma, a jornada é potencializada. Portanto, vale ressaltar que o momento é agora. Em suma, resultados expressivos surgem consequentemente.`;

teste('texto com cheiro alto de IA recebe humanização, não revisão gramatical', () => {
  const r = recomendar(IA);
  assert.strictEqual(r.servicoSugerido, 'humanizacao',
    'vender revisão gramatical aqui gera cliente insatisfeito');
});

teste('recomendação explica o porquê em português', () => {
  const r = recomendar(IA);
  assert.ok(r.motivo.length > 20, 'motivo curto demais para convencer');
  assert.ok(r.motivo.includes(String(r.analise.score)), 'motivo deveria citar o score');
});

teste('recomendação de humanização oferece o diagnóstico como porta de entrada', () => {
  const r = recomendar(IA);
  assert.ok(r.alternativa, 'faltou alternativa barata de entrada');
  assert.ok(r.alternativa.preco < r.orcamento.preco);
});

teste('recomendação sempre vem com orçamento pronto', () => {
  const r = recomendar(IA);
  assert.ok(r.orcamento.preco > 0);
  assert.ok(r.orcamento.prazoTexto);
});

let ok = 0, falhas = 0;
for (const t of testes) {
  try { t.fn(); console.log('  ✓ ' + t.nome); ok++; }
  catch (err) { console.log('  ✗ ' + t.nome + '\n      ' + err.message); falhas++; }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
