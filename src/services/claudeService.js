const axios = require('axios');
const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';

async function chamarClaude(systemPrompt, messages, maxTokens) {
  const apiKey = process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-5';
  const max_tokens = maxTokens || parseInt(process.env.CLAUDE_MAX_TOKENS || '400');

  try {
    const res = await axios.post(`${ANTHROPIC_BASE}/messages`, {
      model,
      max_tokens,
      system: systemPrompt,
      messages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
    });

    const texto = (res.data.content || []).find(c => c.type === 'text')?.text || '';
    const usage = res.data.usage || { input_tokens: 0, output_tokens: 0 };
    return { texto, usage };
  } catch (err) {
    console.error('[CLAUDE ERRO]:', err.response?.data?.error?.message || err.message);
    throw err;
  }
}

async function gerarResumoLead(historicoTexto) {
  const apiKey = process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-5';
  const prompt = `Você é assistente de vendas. Analise a conversa e escreva um resumo DIRETO e CURTO (máx 5 linhas) para o vendedor. Inclua: o que o cliente procura, detalhes relevantes, preferências e urgência. Sem saudações.

CONVERSA:
${historicoTexto}`;

  try {
    const res = await axios.post(`${ANTHROPIC_BASE}/messages`, {
      model,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      timeout: 30000
    });

    const texto = (res.data.content || []).find(c => c.type === 'text')?.text?.trim() || 'Resumo não disponível.';
    const usage = res.data.usage || { input_tokens: 0, output_tokens: 0 };
    return { texto, usage };
  } catch (err) {
    console.error('[CLAUDE RESUMO ERRO]:', err.message);
    return { texto: 'Resumo não disponível. Ver histórico acima.', usage: { input_tokens: 0, output_tokens: 0 } };
  }
}

module.exports = { chamarClaude, gerarResumoLead };
