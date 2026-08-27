/**
 * CATÁLOGO DE SERVIÇOS — Estúdio de Texto
 *
 * Preços ancorados em pesquisa de mercado de agosto de 2026:
 *   • Revisão textual no Brasil: R$ 3–20 por lauda (1.400 caracteres com espaço)
 *   • Copywriting freelance BR: R$ 200–500/hora, R$ 800–5.000/projeto
 *   • Fiverr em 2026: pacote inicial de US$ 75–250 (o gig de US$ 5 morreu)
 *   • EFA 2026: US$ 0,020/palavra revisão, US$ 0,036/palavra edição profunda
 *
 * A lógica de posicionamento: o mercado virou halteres. A ponta commodity
 * ("escreve 500 palavras barato") está encolhendo — contratos de revisão
 * caindo ~2% ao mês. A ponta de julgamento (voz, checagem, consistência)
 * subiu de preço. Todo serviço aqui vive na ponta de cima, e o que
 * sustenta o preço é o RELATÓRIO — a prova mensurável de que melhorou.
 */

const CARACTERES_POR_LAUDA = 1400;

const SERVICOS = {
  diagnostico: {
    nome: 'Diagnóstico de texto',
    descricao: 'Relatório do que está errado no texto, com números. Sem reescrever nada.',
    modelo: 'fixo',
    preco: 90,
    prazoHoras: 4,
    entrega: ['Score de naturalidade 0–100', 'Indícios apontados um a um', 'Trechos problemáticos marcados'],
    // Existe para virar porta de entrada: barato, rápido, e o relatório
    // vende sozinho a revisão completa.
    isca: true
  },

  revisao: {
    nome: 'Revisão gramatical e de estilo',
    descricao: 'Ortografia, gramática, pontuação, concordância e fluidez. Mantém a voz do autor.',
    modelo: 'lauda',
    precoPorLauda: 9,
    minimo: 60,
    prazoHoras: 24,
    entrega: ['Texto revisado', 'Controle de alterações', 'Lista do que mudou e por quê']
  },

  humanizacao: {
    nome: 'Revisão + humanização',
    descricao: 'Tira o cheiro de IA: quebra o ritmo mecânico, corta vocabulário-fantasma, devolve voz.',
    modelo: 'lauda',
    precoPorLauda: 19,
    minimo: 120,
    prazoHoras: 48,
    entrega: ['Texto reescrito', 'Score antes e depois', 'Controle de alterações', 'Relatório de entrega'],
    // O serviço com maior margem: é o que o mercado está pagando mais caro
    // justamente porque exige julgamento, não execução.
    destaque: true
  },

  copy: {
    nome: 'Copy de conversão',
    descricao: 'Página de venda, anúncio, e-mail ou sequência. Escrito para uma ação específica.',
    modelo: 'peca',
    precoPorPeca: { anuncio: 220, email: 280, pagina: 850, sequencia: 1600 },
    prazoHoras: 72,
    entrega: ['Peça finalizada', 'Duas variações de headline', 'Justificativa de cada escolha']
  },

  pacote: {
    nome: 'Retainer mensal',
    descricao: 'Volume fechado por mês, prioridade de fila e prazo reduzido.',
    modelo: 'mensal',
    faixas: [
      { nome: 'Básico',  preco: 900,  laudas: 60,  prazoHoras: 24 },
      { nome: 'Padrão',  preco: 1800, laudas: 140, prazoHoras: 18 },
      { nome: 'Estúdio', preco: 3200, laudas: 280, prazoHoras: 12 }
    ]
  }
};

/**
 * Multiplicadores de prazo. Urgência é onde a margem mora — o custo
 * marginal de entregar rápido é quase zero quando a máquina faz o trabalho.
 */
const URGENCIA = {
  normal:   { fator: 1.0,  rotulo: 'prazo padrão' },
  rapido:   { fator: 1.4,  rotulo: 'metade do prazo' },
  expresso: { fator: 2.0,  rotulo: 'mesmo dia' }
};

/** Complexidade do material — texto técnico dá mais trabalho de checagem. */
const COMPLEXIDADE = {
  simples: { fator: 1.0,  rotulo: 'texto comum' },
  tecnico: { fator: 1.35, rotulo: 'jurídico, médico, técnico ou acadêmico' },
  criativo:{ fator: 1.2,  rotulo: 'literário ou de voz muito marcada' }
};

/**
 * DIVULGAÇÃO DE IA — não é opcional.
 *
 * A Fiverr exige, desde 2026, que o vendedor declare quando a entrega é
 * predominantemente gerada por IA. Omitir isso é o caminho mais curto para
 * perder a conta, e é o tipo de risco que não vale um pedido.
 */
const DIVULGACAO = {
  assistida: 'Este trabalho foi produzido com apoio de ferramentas de IA e revisado por mim antes da entrega.',
  gerada: 'Este texto foi gerado com IA e editado por mim. Posso detalhar o processo se você quiser.',
  humana: 'Texto escrito e revisado manualmente.'
};

function getServico(id) {
  return SERVICOS[id] || null;
}

/** Lauda-padrão brasileira: 1.400 caracteres com espaço. */
function contarLaudas(texto) {
  return Math.max(1, Math.ceil(texto.length / CARACTERES_POR_LAUDA));
}

module.exports = {
  SERVICOS, URGENCIA, COMPLEXIDADE, DIVULGACAO,
  CARACTERES_POR_LAUDA, getServico, contarLaudas
};
