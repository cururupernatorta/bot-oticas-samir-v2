const axios = require('axios');
const { gerarPromptResumo } = require('../utils/systemPrompt');

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const MODELO_PADRAO = 'claude-sonnet-5';
const RETENTAVEIS = new Set([408, 429, 500, 502, 503, 504, 529]);

// TTL do cache do system prompt. O prefixo é o MESMO para todas as conversas
// de um cliente, então qualquer mensagem de qualquer cliente final mantém a
// entrada quente. '5m' basta em horário de movimento; '1h' custa o dobro para
// escrever e só compensa em cliente de baixo volume (ver scripts/custos.js).
const CACHE_TTL = process.env.CACHE_TTL === '5m' ? '5m' : '1h';

function espera(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function chamar({ system, messages, maxTokens, tentativas = 3, cachear = false }) {
  const apiKey = process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL || MODELO_PADRAO;
  const max_tokens = maxTokens || parseInt(process.env.CLAUDE_MAX_TOKENS || '400', 10);

  const corpo = { model, max_tokens, messages };

  if (system) {
    // Com cache: o system prompt vira um bloco com breakpoint. Ele é idêntico
    // em toda mensagem daquele cliente, então a 2ª mensagem em diante lê o
    // prefixo a ~10% do preço de entrada em vez de reprocessá-lo inteiro.
    corpo.system = cachear
      ? [{
          type: 'text',
          text: system,
          cache_control: CACHE_TTL === '1h'
            ? { type: 'ephemeral', ttl: '1h' }
            : { type: 'ephemeral' }
        }]
      : system;
  }

  let ultimoErro;
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await axios.post(`${ANTHROPIC_BASE}/messages`, corpo, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      });
      const u = res.data.usage || {};
      const usage = {
        input_tokens: u.input_tokens || 0,
        output_tokens: u.output_tokens || 0,
        cache_creation_input_tokens: u.cache_creation_input_tokens || 0,
        cache_read_input_tokens: u.cache_read_input_tokens || 0
      };
      if (cachear && process.env.LOG_CACHE === '1') {
        console.log(`[CACHE] leu ${usage.cache_read_input_tokens} · escreveu ${usage.cache_creation_input_tokens} · normal ${usage.input_tokens}`);
      }
      return {
        texto: (res.data.content || []).find(c => c.type === 'text')?.text || '',
        usage
      };
    } catch (err) {
      ultimoErro = err;
      const status = err.response?.status;
      const podeTentar = !status || RETENTAVEIS.has(status);
      if (!podeTentar || i === tentativas - 1) break;
      const atraso = 400 * Math.pow(2, i);
      console.warn(`[IA] tentativa ${i + 1} falhou (${status || err.code}) — nova tentativa em ${atraso}ms`);
      await espera(atraso);
    }
  }

  console.error('[IA ERRO]:', ultimoErro.response?.data?.error?.message || ultimoErro.message);
  throw ultimoErro;
}

async function chamarClaude(systemPrompt, messages, maxTokens) {
  return chamar({ system: systemPrompt, messages, maxTokens, cachear: true });
}

/** Resumo do lead para a equipe — o prompt varia conforme o nicho do cliente. */
async function gerarResumoLead(cliente, historicoTexto) {
  // Compatibilidade com a assinatura antiga gerarResumoLead(historicoTexto).
  if (typeof cliente === 'string') {
    historicoTexto = cliente;
    cliente = {};
  }

  try {
    return await chamar({
      messages: [{ role: 'user', content: gerarPromptResumo(cliente, historicoTexto) }],
      maxTokens: 300,
      tentativas: 2
    });
  } catch (err) {
    return { texto: 'Resumo não disponível — veja o histórico abaixo.', usage: { input_tokens: 0, output_tokens: 0 } };
  }
}

module.exports = { chamarClaude, gerarResumoLead, CACHE_TTL };
