/**
 * Testes do analisador — a métrica que o cliente paga para ver.
 * Se estes testes quebrarem, o serviço perde o argumento de venda.
 */
const assert = require('assert');
const {
  analisar, burstiness, dividirFrases, dividirParagrafos,
  palavras, riquezaVocabular, bigramasRepetidos
} = require('../src/estudio/analisador');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

// ── Amostras reais usadas como âncora ───────────────────────────────
const IA_PURA = `No cenário atual, a transformação digital tornou-se um elemento crucial para empresas que desejam se manter competitivas. Além disso, a adoção de tecnologias inovadoras permite alavancar resultados de maneira significativa e sustentável.

É importante destacar que a implementação de soluções robustas exige planejamento meticuloso. Dessa forma, as organizações conseguem otimizar seus processos internos e potencializar a experiência do cliente final. Nesse sentido, investir em capacitação torna-se fundamental para o sucesso.

Por outro lado, muitas empresas ainda enfrentam desafios na adoção dessas ferramentas. Portanto, é imprescindível contar com parceiros especializados que compreendam as particularidades de cada negócio. Consequentemente, os resultados obtidos tendem a ser mais expressivos e duradouros.

Em suma, a jornada de transformação digital representa uma oportunidade singular para negócios de todos os portes. Vale ressaltar que o momento de agir é agora, pois o mercado não espera por aqueles que hesitam.`;

const HUMANO = `Comprei a máquina em março. Achei cara.

Três meses depois, a conta fechou: ela paga sozinha o aluguel da sala. Não porque produz mais — produz quase igual à antiga, honestamente. É que ela não quebra. E máquina que não quebra num negócio pequeno vale mais do que máquina rápida, porque quando a antiga parava eu perdia o dia inteiro ligando pra assistência, remarcando cliente, ouvindo desaforo no telefone.

Ninguém te conta isso quando vai vender. Falam de velocidade, de rendimento por hora, mostram planilha. A planilha nunca tem a linha "dias que você vai passar sem trabalhar esperando peça".

Se eu pudesse voltar, compraria antes. Só isso.`;

// ── O teste que importa: separa máquina de gente ────────────────────
teste('texto de IA pontua alto', () => {
  const r = analisar(IA_PURA);
  assert.ok(r.score >= 70, 'esperado >=70, veio ' + r.score);
});

teste('texto humano pontua baixo', () => {
  const r = analisar(HUMANO);
  assert.ok(r.score <= 25, 'esperado <=25, veio ' + r.score);
});

teste('a separação entre os dois é ampla — não é ruído', () => {
  const ia = analisar(IA_PURA).score;
  const humano = analisar(HUMANO).score;
  assert.ok(ia - humano >= 50, 'separação estreita demais: ' + ia + ' vs ' + humano);
});

teste('é determinístico — mesma entrada, mesmo número, sempre', () => {
  const a = analisar(IA_PURA).score;
  for (let i = 0; i < 5; i++) {
    assert.strictEqual(analisar(IA_PURA).score, a, 'score variou entre execuções');
  }
});

// ── Burstiness ──────────────────────────────────────────────────────
teste('burstiness distingue ritmo uniforme de ritmo variado', () => {
  const uniforme = analisar(IA_PURA).metricas.burstiness;
  const variado = analisar(HUMANO).metricas.burstiness;
  assert.ok(variado > uniforme, 'humano deveria ter mais variação de ritmo');
});

teste('burstiness lida com frase única sem quebrar', () => {
  const b = burstiness(['Uma frase só.']);
  assert.strictEqual(b.cv, 0);
  assert.strictEqual(b.amostras, 1);
});

teste('burstiness lida com lista vazia', () => {
  assert.doesNotThrow(() => burstiness([]));
});

// ── Divisão de frases ───────────────────────────────────────────────
teste('não quebra frase em abreviação', () => {
  const f = dividirFrases('Falei com o Dr. Silva ontem. Ele concordou.');
  assert.strictEqual(f.length, 2, 'esperado 2 frases, veio ' + f.length + ': ' + JSON.stringify(f));
});

teste('não quebra em número decimal', () => {
  const f = dividirFrases('O preço subiu 3.5 por cento. Ninguém reclamou.');
  assert.strictEqual(f.length, 2, 'veio ' + JSON.stringify(f));
});

teste('trata reticências como uma frase só', () => {
  const f = dividirFrases('Pensei muito... e desisti.');
  assert.strictEqual(f.length, 1, 'veio ' + JSON.stringify(f));
});

teste('divide corretamente em ! e ?', () => {
  assert.strictEqual(dividirFrases('Vem cá! Você viu isso? Eu vi.').length, 3);
});

// ── Parágrafos e palavras ───────────────────────────────────────────
teste('separa parágrafos por linha em branco', () => {
  assert.strictEqual(dividirParagrafos('Um.\n\nDois.\n\nTrês.').length, 3);
});

teste('quebra de linha simples não cria parágrafo', () => {
  assert.strictEqual(dividirParagrafos('Uma linha\noutra linha').length, 1);
});

teste('conta palavras com acento corretamente', () => {
  const p = palavras('coração ação você não é');
  assert.ok(p.includes('coração'), 'perdeu palavra acentuada: ' + JSON.stringify(p));
  assert.strictEqual(p.length, 5);
});

// ── Riqueza vocabular e bigramas ────────────────────────────────────
teste('riqueza vocabular cai com repetição', () => {
  const repetido = riquezaVocabular(palavras('teste teste teste teste teste'));
  const variado  = riquezaVocabular(palavras('cada palavra aqui é diferente sempre'));
  assert.ok(variado.ttr > repetido.ttr);
});

teste('detecta bigrama repetido', () => {
  const ws = palavras('a solução ideal traz a solução ideal e mais a solução ideal ainda');
  const bg = bigramasRepetidos(ws, 3);
  assert.ok(bg.some(b => b.bigrama === 'solução ideal'), 'não achou: ' + JSON.stringify(bg));
});

// ── Robustez ────────────────────────────────────────────────────────
teste('texto vazio lança erro claro', () => {
  assert.throws(() => analisar(''), /vazio/);
  assert.throws(() => analisar('   '), /vazio/);
});

teste('texto curto marca confiança baixa — não finge precisão', () => {
  assert.strictEqual(analisar('Frase curta. Outra.').confianca, 'baixa');
});

teste('texto longo marca confiança alta', () => {
  assert.strictEqual(analisar(IA_PURA + '\n\n' + IA_PURA + '\n\n' + IA_PURA).confianca, 'alta');
});

teste('score fica sempre entre 0 e 100', () => {
  for (const t of [IA_PURA, HUMANO, 'Oi.', 'a '.repeat(500)]) {
    const s = analisar(t).score;
    assert.ok(s >= 0 && s <= 100, 'score fora da faixa: ' + s);
  }
});

teste('todo indício vem com medida legível para o cliente', () => {
  for (const i of analisar(IA_PURA).indicios) {
    assert.ok(i.nome && i.medida && i.leitura, 'indício incompleto: ' + JSON.stringify(i));
  }
});

let ok = 0, falhas = 0;
for (const t of testes) {
  try { t.fn(); console.log('  ✓ ' + t.nome); ok++; }
  catch (err) { console.log('  ✗ ' + t.nome + '\n      ' + err.message); falhas++; }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
