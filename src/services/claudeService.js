const axios = require('axios');
const { gerarPromptResumo } = require('../utils/systemPrompt');

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const MODELO_PADRAO = 'claude-sonnet-5';
const RETENTAVEIS = new Set([408, 429, 500, 502, 503, 504, 529]);

function espera(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function chamar({ system, messages, maxTokens, tentativas = 3 }) {
  const apiKey = process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL || MODELO_PADRAO;
  const max_tokens = maxTokens || parseInt(process.env.CLAUDE_MAX_TOKENS || '400', 10);

  const corpo = { model, max_tokens, messages };
  if (system) corpo.system = system;

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
      return {
        texto: (res.data.content || []).find(c => c.type === 'text')?.text || '',
        usage: res.data.usage || { input_tokens: 0, output_tokens: 0 }
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
  return chamar({ system: systemPrompt, messages, maxTokens });
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

module.exports = { chamarClaude, gerarResumoLead };
