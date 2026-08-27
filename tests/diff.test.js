/**
 * Testes do diff — a prova de que o serviço foi prestado.
 */
const assert = require('assert');
const { comparar, coalescer, estatisticas, paraHtml, paraTexto, listarMudancas, escaparHtml } = require('../src/estudio/diff');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

teste('texto idêntico não gera mudança nenhuma', () => {
  const ops = comparar('Texto igual.', 'Texto igual.');
  assert.strictEqual(listarMudancas(ops).length, 0);
  assert.strictEqual(estatisticas(ops).percentualAlterado, 0);
});

teste('detecta inserção pura', () => {
  const ops = comparar('Vendemos óculos.', 'Vendemos óculos de sol.');
  const st = estatisticas(ops);
  assert.ok(st.inseridas > 0, 'deveria contar inserção');
  assert.strictEqual(st.removidas, 0, 'não removeu nada');
});

teste('detecta remoção pura', () => {
  const ops = comparar('Vendemos óculos de sol.', 'Vendemos óculos.');
  const st = estatisticas(ops);
  assert.ok(st.removidas > 0);
  assert.strictEqual(st.inseridas, 0);
});

teste('reconstrói o original a partir de igual + removido', () => {
  const a = 'O produto e vendido em tres lojas.';
  const b = 'O produto é vendido em três lojas.';
  const recon = comparar(a, b).filter(o => o.tipo !== 'inserido').map(o => o.texto).join('');
  assert.strictEqual(recon, a, 'o diff perdeu conteúdo do original');
});

teste('reconstrói o revisado a partir de igual + inserido', () => {
  const a = 'O produto e vendido em tres lojas.';
  const b = 'O produto é vendido em três lojas.';
  const recon = comparar(a, b).filter(o => o.tipo !== 'removido').map(o => o.texto).join('');
  assert.strictEqual(recon, b, 'o diff perdeu conteúdo do revisado');
});

teste('coalescer transforma reescrita fragmentada em uma mudança legível', () => {
  const a = 'É importante destacar que a solução robusta permite alavancar resultados de forma significativa.';
  const b = 'A solução resolve o problema e o resultado aparece rápido.';
  const cru = listarMudancas(comparar(a, b)).length;
  const fundido = listarMudancas(coalescer(comparar(a, b))).length;
  assert.ok(fundido < cru, 'coalescer deveria reduzir fragmentação (' + cru + ' → ' + fundido + ')');
  assert.strictEqual(fundido, 1, 'reescrita total deveria virar 1 mudança, veio ' + fundido);
});

teste('coalescer preserva o conteúdo — nada some no caminho', () => {
  const a = 'É importante destacar que a solução robusta permite alavancar resultados.';
  const b = 'A solução resolve o problema rápido.';
  const ops = coalescer(comparar(a, b));
  const origRecon = ops.filter(o => o.tipo !== 'inserido').map(o => o.texto).join('');
  const revRecon  = ops.filter(o => o.tipo !== 'removido').map(o => o.texto).join('');
  assert.strictEqual(origRecon, a, 'coalescer corrompeu o original');
  assert.strictEqual(revRecon, b, 'coalescer corrompeu o revisado');
});

teste('percentual alterado reflete a intensidade da revisão', () => {
  const leve = estatisticas(comparar('O produto e bom e barato hoje.', 'O produto é bom e barato hoje.'));
  const pesado = estatisticas(comparar('O produto e bom e barato hoje.', 'Nada aqui permanece igual ao anterior.'));
  assert.ok(pesado.percentualAlterado > leve.percentualAlterado);
});

teste('HTML usa del e ins, o formato que o cliente reconhece do Word', () => {
  const html = paraHtml(comparar('texto antigo', 'texto novo'));
  assert.ok(html.includes('<del>'), 'faltou <del>');
  assert.ok(html.includes('<ins>'), 'faltou <ins>');
});

teste('HTML escapa conteúdo — texto do cliente não injeta markup', () => {
  const html = paraHtml(comparar('<script>alert(1)</script>', 'seguro'));
  assert.ok(!html.includes('<script>'), 'injeção de HTML passou');
  assert.ok(html.includes('&lt;script&gt;'), 'deveria escapar');
});

teste('escaparHtml cobre os cinco caracteres perigosos', () => {
  assert.strictEqual(escaparHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});

teste('texto puro usa marcação legível em WhatsApp', () => {
  const t = paraTexto(comparar('antigo', 'novo'));
  assert.ok(t.includes('[-antigo-]'), 'faltou marcação de remoção: ' + t);
  assert.ok(t.includes('{+novo+}'), 'faltou marcação de inserção: ' + t);
});

teste('mudança vem com contexto antes e depois', () => {
  const ops = comparar(
    'A loja fica na avenida principal e abre cedo todos os dias.',
    'A loja fica na avenida central e abre cedo todos os dias.'
  );
  const m = listarMudancas(ops)[0];
  assert.ok(m.antes.length > 0, 'faltou contexto anterior');
  assert.ok(m.depois.length > 0, 'faltou contexto posterior');
  assert.strictEqual(m.tipo, 'substituição');
});

teste('lida com texto vazio dos dois lados', () => {
  assert.doesNotThrow(() => comparar('', ''));
  assert.strictEqual(listarMudancas(comparar('', '')).length, 0);
});

teste('lida com original vazio (texto novo do zero)', () => {
  const st = estatisticas(comparar('', 'texto novo'));
  assert.strictEqual(st.removidas, 0);
  assert.ok(st.inseridas > 0);
});

teste('preserva acento e pontuação intactos', () => {
  const ops = comparar('coração, ação!', 'coração, emoção!');
  const recon = ops.filter(o => o.tipo !== 'removido').map(o => o.texto).join('');
  assert.strictEqual(recon, 'coração, emoção!');
});

let ok = 0, falhas = 0;
for (const t of testes) {
  try { t.fn(); console.log('  ✓ ' + t.nome); ok++; }
  catch (err) { console.log('  ✗ ' + t.nome + '\n      ' + err.message); falhas++; }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
