/**
 * ANALISADOR — mede "cheiro de IA" em português, sem chamar LLM nenhum.
 *
 * Este é o diferencial do serviço, não o gerador de texto.
 *
 * Qualquer um consegue pedir texto pro ChatGPT. O que ninguém entrega é
 * PROVA de que o texto melhorou. Um número antes e depois, com os trechos
 * marcados, é o que justifica cobrar R$ 250 em vez de R$ 25 — e é o que
 * transforma "confia em mim" em "olha o relatório".
 *
 * Todas as métricas são determinísticas: mesma entrada, mesmo número,
 * sempre. Não dá para fazer isso com LLM julgando, e é exatamente por
 * isso que dá para vender.
 */

// ── Vocabulário-fantasma: palavras que IA usa muito mais que gente ────
// Levantadas dos padrões recorrentes de texto gerado em PT-BR.
const PALAVRAS_FANTASMA = [
  'crucial', 'fundamental', 'robusto', 'robusta', 'alavancar', 'potencializar',
  'otimizar', 'revolucionar', 'revolucionário', 'inovador', 'inovadora',
  'holístico', 'holística', 'sinergia', 'paradigma', 'disruptivo', 'disruptiva',
  'multifacetado', 'multifacetada', 'intrincado', 'intrincada', 'meticuloso',
  'meticulosa', 'abrangente', 'aprimorar', 'elevar', 'desbloquear',
  'imprescindível', 'indispensável', 'primordial', 'notável', 'singular'
];

// ── Frases-carimbo: construções que praticamente só aparecem em IA ────
const FRASES_CARIMBO = [
  'no cenário atual', 'no mundo de hoje', 'nos dias de hoje',
  'em um mundo cada vez mais', 'num mundo cada vez mais',
  'vale ressaltar', 'vale destacar', 'é importante destacar',
  'é importante ressaltar', 'cabe salientar', 'cabe destacar',
  'não é apenas', 'mais do que nunca', 'em última análise',
  'em suma', 'em síntese', 'por fim, mas não menos importante',
  'desvende', 'mergulhe no', 'mergulhe na', 'descubra o poder',
  'transformar a maneira', 'mudar a forma como', 'leve seu',
  'ao longo deste artigo', 'neste artigo, vamos', 'prepare-se para'
];

// ── Conectivos: IA abusa deles para costurar frases ───────────────────
const CONECTIVOS = [
  'além disso', 'ademais', 'outrossim', 'portanto', 'no entanto',
  'entretanto', 'contudo', 'todavia', 'dessa forma', 'desse modo',
  'assim sendo', 'por outro lado', 'nesse sentido', 'diante disso',
  'por conseguinte', 'consequentemente', 'sendo assim', 'dito isso',
  'em contrapartida', 'a fim de', 'com o intuito de', 'de modo que'
];

/** Divide em frases respeitando abreviações comuns e reticências. */
function dividirFrases(texto) {
  const protegido = texto
    .replace(/\b(Sr|Sra|Dr|Dra|Prof|Ltda|etc|Av|Ex|pág|núm|vs)\./gi, '$1<PONTO>')
    .replace(/\.\.\./g, '<RETICENCIAS>')
    .replace(/(\d)\.(\d)/g, '$1<PONTO>$2');

  return protegido
    .split(/(?<=[.!?])\s+/)
    .map(f => f.replace(/<PONTO>/g, '.').replace(/<RETICENCIAS>/g, '...').trim())
    .filter(f => f.length > 0);
}

function dividirParagrafos(texto) {
  return texto.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

function palavras(texto) {
  return (texto.toLowerCase().match(/[a-záàâãéêíóôõúüç]+/gi) || []);
}

function contarOcorrencias(textoMinusculo, termos) {
  const achados = [];
  for (const termo of termos) {
    // \b não funciona bem com acento em JS; delimitamos por não-letra.
    const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-záàâãéêíóôõúüç])${escapado}([^a-záàâãéêíóôõúüç]|$)`, 'gi');
    const n = (textoMinusculo.match(re) || []).length;
    if (n > 0) achados.push({ termo, n });
  }
  return achados;
}

/**
 * BURSTINESS — a métrica mais reveladora.
 *
 * Gente escreve frase curta depois de frase longa. IA converge para um
 * comprimento médio e fica lá. Coeficiente de variação alto = humano.
 */
function burstiness(frases) {
  if (frases.length < 2) return { cv: 0, media: 0, desvio: 0, amostras: frases.length };

  const comprimentos = frases.map(f => palavras(f).length);
  const media = comprimentos.reduce((a, b) => a + b, 0) / comprimentos.length;
  if (media === 0) return { cv: 0, media: 0, desvio: 0, amostras: frases.length };

  const variancia = comprimentos.reduce((s, c) => s + (c - media) ** 2, 0) / comprimentos.length;
  const desvio = Math.sqrt(variancia);

  return {
    cv: desvio / media,          // coeficiente de variação
    media: Number(media.toFixed(1)),
    desvio: Number(desvio.toFixed(1)),
    amostras: frases.length,
    comprimentos
  };
}

/** Uniformidade de parágrafo: IA produz blocos do mesmo tamanho. */
function uniformidadeParagrafos(paragrafos) {
  if (paragrafos.length < 3) return { cv: null, amostras: paragrafos.length };

  const tamanhos = paragrafos.map(p => palavras(p).length);
  const media = tamanhos.reduce((a, b) => a + b, 0) / tamanhos.length;
  if (media === 0) return { cv: null, amostras: paragrafos.length };

  const desvio = Math.sqrt(tamanhos.reduce((s, t) => s + (t - media) ** 2, 0) / tamanhos.length);
  return { cv: desvio / media, media: Number(media.toFixed(1)), amostras: paragrafos.length };
}

/** Repetição: proporção de vocabulário único (type-token ratio). */
function riquezaVocabular(ws) {
  if (!ws.length) return { ttr: 0, unicas: 0, total: 0 };
  const unicas = new Set(ws).size;
  return { ttr: unicas / ws.length, unicas, total: ws.length };
}

/** Bigramas repetidos: IA reusa as mesmas costuras de frase. */
function bigramasRepetidos(ws, minimo = 3) {
  const mapa = new Map();
  for (let i = 0; i < ws.length - 1; i++) {
    const bg = ws[i] + ' ' + ws[i + 1];
    mapa.set(bg, (mapa.get(bg) || 0) + 1);
  }
  return [...mapa.entries()]
    .filter(([bg, n]) => n >= minimo && bg.length > 8)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([bg, n]) => ({ bigrama: bg, n }));
}

/**
 * Analisa um texto e devolve o score de 0 a 100.
 * 0 = lê como gente. 100 = lê como máquina.
 */
function analisar(texto) {
  if (!texto || !texto.trim()) {
    throw new Error('texto vazio');
  }

  const minusculo = texto.toLowerCase();
  const frases = dividirFrases(texto);
  const paras = dividirParagrafos(texto);
  const ws = palavras(texto);

  const b = burstiness(frases);
  const up = uniformidadeParagrafos(paras);
  const rv = riquezaVocabular(ws);

  const fantasmas = contarOcorrencias(minusculo, PALAVRAS_FANTASMA);
  const carimbos = contarOcorrencias(minusculo, FRASES_CARIMBO);
  const conectivos = contarOcorrencias(minusculo, CONECTIVOS);
  const bigramas = bigramasRepetidos(ws);

  const por1000 = n => (ws.length ? (n / ws.length) * 1000 : 0);
  const totalFantasmas = fantasmas.reduce((s, f) => s + f.n, 0);
  const totalCarimbos  = carimbos.reduce((s, f) => s + f.n, 0);
  const totalConectivos = conectivos.reduce((s, f) => s + f.n, 0);

  // ── Pontuação por indício. Cada um vira 0–100 de "suspeita". ────────
  const indicios = [];

  // Burstiness: humano fica ~0.55+; IA costuma cair abaixo de 0.40.
  const suspeitaBurst = b.amostras < 4 ? null
    : Math.max(0, Math.min(100, (0.60 - b.cv) / 0.60 * 100));
  if (suspeitaBurst !== null) {
    indicios.push({
      nome: 'Ritmo das frases',
      peso: 0.32,
      suspeita: suspeitaBurst,
      medida: `variação ${b.cv.toFixed(2)} (média ${b.media} palavras)`,
      leitura: b.cv < 0.35 ? 'frases quase todas do mesmo tamanho'
             : b.cv < 0.50 ? 'ritmo pouco variado'
             : 'ritmo natural'
    });
  }

  // Frases-carimbo: qualquer ocorrência já é forte indício.
  const suspeitaCarimbo = Math.min(100, totalCarimbos * 28);
  indicios.push({
    nome: 'Frases-carimbo',
    peso: 0.24,
    suspeita: suspeitaCarimbo,
    medida: `${totalCarimbos} ocorrência(s)`,
    itens: carimbos,
    leitura: totalCarimbos === 0 ? 'nenhuma' : carimbos.map(c => `"${c.termo}"`).join(', ')
  });

  // Vocabulário-fantasma normalizado por tamanho.
  const densFantasma = por1000(totalFantasmas);
  const suspeitaFantasma = Math.min(100, densFantasma * 12);
  indicios.push({
    nome: 'Vocabulário-fantasma',
    peso: 0.18,
    suspeita: suspeitaFantasma,
    medida: `${totalFantasmas} em ${ws.length} palavras (${densFantasma.toFixed(1)}/mil)`,
    itens: fantasmas,
    leitura: totalFantasmas === 0 ? 'nenhuma' : fantasmas.map(f => `"${f.termo}"`).join(', ')
  });

  // Conectivos: um pouco é bom, muito é costura mecânica.
  const densConectivo = por1000(totalConectivos);
  const suspeitaConectivo = Math.max(0, Math.min(100, (densConectivo - 4) * 9));
  indicios.push({
    nome: 'Excesso de conectivos',
    peso: 0.14,
    suspeita: suspeitaConectivo,
    medida: `${totalConectivos} em ${ws.length} palavras (${densConectivo.toFixed(1)}/mil)`,
    itens: conectivos,
    leitura: densConectivo < 5 ? 'dentro do normal' : 'costura mecânica entre frases'
  });

  // Uniformidade de parágrafo.
  const suspeitaPara = up.cv === null ? null
    : Math.max(0, Math.min(100, (0.45 - up.cv) / 0.45 * 100));
  if (suspeitaPara !== null) {
    indicios.push({
      nome: 'Blocos de parágrafo',
      peso: 0.12,
      suspeita: suspeitaPara,
      medida: `variação ${up.cv.toFixed(2)} em ${up.amostras} parágrafos`,
      leitura: up.cv < 0.25 ? 'parágrafos do mesmo tamanho, como fôrma' : 'variação aceitável'
    });
  }

  // Média ponderada só dos indícios que puderam ser medidos.
  const validos = indicios.filter(i => i.suspeita !== null);
  const pesoTotal = validos.reduce((s, i) => s + i.peso, 0);
  const score = pesoTotal === 0 ? 0
    : Math.round(validos.reduce((s, i) => s + i.suspeita * i.peso, 0) / pesoTotal);

  return {
    score,
    veredito: score >= 70 ? 'lê como máquina'
            : score >= 45 ? 'ainda tem cheiro de IA'
            : score >= 25 ? 'passa como humano'
            : 'lê como gente',
    metricas: {
      palavras: ws.length,
      frases: frases.length,
      paragrafos: paras.length,
      burstiness: Number(b.cv.toFixed(3)),
      mediaPalavrasPorFrase: b.media,
      riquezaVocabular: Number(rv.ttr.toFixed(3)),
      bigramasRepetidos: bigramas
    },
    indicios: indicios.map(({ peso, ...resto }) => resto),
    // Confiança baixa em texto curto: as métricas precisam de amostra.
    confianca: ws.length < 120 ? 'baixa' : ws.length < 400 ? 'média' : 'alta'
  };
}

module.exports = {
  analisar, burstiness, dividirFrases, dividirParagrafos, palavras,
  riquezaVocabular, bigramasRepetidos, uniformidadeParagrafos,
  PALAVRAS_FANTASMA, FRASES_CARIMBO, CONECTIVOS
};
