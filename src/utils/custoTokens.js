/**
 * CUSTO DE IA — preços oficiais em USD, convertidos para BRL.
 *
 * O modelo antigo tinha um único preço por token de entrada. Com prompt caching
 * existem TRÊS preços de entrada diferentes, e ignorar isso erra a conta em ~5x:
 *
 *   entrada normal ......... 1,00x  (tokens que não estavam no cache)
 *   escrita no cache ....... 1,25x  (TTL 5 min)  /  2,00x  (TTL 1 h)
 *   leitura do cache ....... 0,10x  ← é aqui que mora a economia
 *
 * Tabela Anthropic (USD por milhão de tokens):
 *   Claude Sonnet 5 ....... entrada $2,00  · saída $10,00  · mín. p/ cache 1.024 tokens
 *   Claude Haiku 4.5 ...... entrada $1,00  · saída  $5,00  · mín. p/ cache 4.096 tokens
 *
 * ⚠️ O mínimo cacheável importa mais que o preço de tabela: nosso system prompt
 * tem ~1.700 tokens. Ele CACHEIA no Sonnet 5 e NÃO cacheia no Haiku 4.5 — o que
 * torna o Sonnet 5 com cache mais barato que o Haiku sem cache. Ver docs/CUSTOS.md.
 */

const TABELA_USD_POR_MILHAO = {
  'claude-sonnet-5': { entrada: 2.00, saida: 10.00, minimoCache: 1024 },
  'claude-haiku-4-5': { entrada: 1.00, saida: 5.00, minimoCache: 4096 },
  'claude-opus-5': { entrada: 5.00, saida: 25.00, minimoCache: 512 }
};

const MULT_ESCRITA_5M = 1.25;
const MULT_ESCRITA_1H = 2.00;
const MULT_LEITURA = 0.10;

/**
 * Câmbio efetivo, não o câmbio do dia.
 * A cobrança é em dólar no cartão internacional: some IOF (~3,5%) e o spread do
 * emissor (~2%) sobre a cotação. Configure em CAMBIO_USD_BRL e revise todo mês.
 */
function cambio() {
  return parseFloat(process.env.CAMBIO_USD_BRL || '5.40');
}

function tabela(modelo) {
  return TABELA_USD_POR_MILHAO[modelo || process.env.CLAUDE_MODEL || 'claude-sonnet-5']
      || TABELA_USD_POR_MILHAO['claude-sonnet-5'];
}

/**
 * Custo em BRL de uma chamada, a partir do objeto `usage` devolvido pela API.
 * @param {object} usage  { input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens }
 */
function calcularCusto(usage = {}, modelo, ttl) {
  // Compatibilidade com a assinatura antiga: calcularCusto(inputTokens, outputTokens)
  if (typeof usage === 'number') {
    usage = { input_tokens: usage, output_tokens: arguments[1] || 0 };
    modelo = undefined; ttl = undefined;
  }

  const p = tabela(modelo);
  const multEscrita = (ttl || process.env.CACHE_TTL) === '1h' ? MULT_ESCRITA_1H : MULT_ESCRITA_5M;

  const usd = (
      (usage.input_tokens || 0) * p.entrada
    + (usage.cache_creation_input_tokens || 0) * p.entrada * multEscrita
    + (usage.cache_read_input_tokens || 0) * p.entrada * MULT_LEITURA
    + (usage.output_tokens || 0) * p.saida
  ) / 1e6;

  return Math.round(usd * cambio() * 1e6) / 1e6;
}

/** Quanto a mesma chamada custaria SEM cache — para medir a economia real. */
function custoSemCache(usage = {}, modelo) {
  const p = tabela(modelo);
  const entrada = (usage.input_tokens || 0)
                + (usage.cache_creation_input_tokens || 0)
                + (usage.cache_read_input_tokens || 0);
  const usd = (entrada * p.entrada + (usage.output_tokens || 0) * p.saida) / 1e6;
  return Math.round(usd * cambio() * 1e6) / 1e6;
}

module.exports = {
  calcularCusto, custoSemCache, cambio, tabela,
  TABELA_USD_POR_MILHAO, MULT_ESCRITA_5M, MULT_ESCRITA_1H, MULT_LEITURA
};
