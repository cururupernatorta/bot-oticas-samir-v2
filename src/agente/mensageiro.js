const { chamarClaude } = require('../services/claudeService');
const { getPlano } = require('../config/planos');
const { AGENTE, getNicho } = require('./config');
const { rodapeOptOut } = require('./compliance');

/**
 * MENSAGEIRO — escreve a abordagem.
 *
 * A tese comercial embutida aqui: a primeira mensagem NÃO vende.
 * Ela entrega um diagnóstico específico daquele negócio. "Oi, quer um bot?"
 * tem taxa de resposta perto de zero; "reparei que vocês fecham 18h e o
 * WhatsApp de vocês é o canal principal" abre conversa.
 *
 * Por isso a etapa 1 da cadência é 'diagnostico', não 'pitch'.
 */

const LIMITE_CARACTERES = 480; // WhatsApp: acima disso vira parede de texto

const SYSTEM_ABORDAGEM = `Você escreve a PRIMEIRA mensagem de WhatsApp de um vendedor brasileiro para um comércio local que ainda não o conhece.

O produto: assistente de IA que responde o WhatsApp da empresa 24h, qualifica o cliente e avisa o vendedor certo. Não substitui vendedor — atende quem chega fora do horário e quem ficaria esperando.

COMO ESCREVER:
- Português brasileiro falado, direto, de pessoa para pessoa. Nada de corporativês.
- Abra pelo DIAGNÓSTICO específico da empresa (use o gancho fornecido). Nunca abra com "sou fulano da empresa tal".
- No máximo 4 linhas curtas. Isso é WhatsApp, não e-mail.
- Termine com UMA pergunta simples e fácil de responder.
- Sem emoji em excesso: no máximo 1.
- Nunca invente dados: nada de "vi suas 300 avaliações" se isso não foi informado.
- Não cite preço na primeira mensagem.
- Não use "olá", "prezado", "venho por meio desta". Use "oi" ou o nome da empresa.

Responda SOMENTE com JSON válido, sem markdown:
{"mensagem":"...","assunto":"..."}`;

const SYSTEM_FOLLOWUP = {
  prova_social: `Você escreve o SEGUNDO contato de WhatsApp, 3 dias após o primeiro sem resposta.
Regras: reconheça brevemente que já escreveu, traga UM resultado concreto e verificável do produto (atendimento fora do horário que virou venda), máximo 3 linhas, termine com pergunta leve. Sem cobrança, sem "estou aguardando seu retorno".
Responda SOMENTE JSON: {"mensagem":"..."}`,

  oferta_teste: `Você escreve o TERCEIRO contato de WhatsApp, 7 dias depois, ainda sem resposta.
Regras: ofereça um teste sem compromisso e sem cartão. Diga o que a pessoa recebe no teste. Máximo 3 linhas. Termine com pergunta de sim/não fácil.
Responda SOMENTE JSON: {"mensagem":"..."}`,

  encerramento: `Você escreve o ÚLTIMO contato de WhatsApp, 14 dias depois, sem nenhuma resposta.
Regras: encerre com elegância e sem culpa. Diga que não insiste mais e deixe a porta aberta. Máximo 2 linhas. NÃO faça pergunta. Isto é uma despedida, não mais uma tentativa.
Responda SOMENTE JSON: {"mensagem":"..."}`
};

function extrairJson(texto) {
  const limpo = texto.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  return JSON.parse(limpo);
}

function fichaProspect(prospect) {
  return [
    `Empresa: ${prospect.nome}`,
    `Ramo: ${getNicho(prospect.nicho).label}`,
    `Cidade: ${prospect.cidade}`,
    `Horário publicado: ${prospect.horarioPublicado || 'não informado'}`,
    `Tem site: ${prospect.site ? 'sim' : 'não'}`,
    `GANCHO (use isto como abertura): ${prospect.gancho || 'não informado'}`,
    `Dor principal: ${prospect.dorPrincipal || 'mensagens fora do horário sem resposta'}`,
    `Nome do vendedor que assina: ${AGENTE.vendedor.nome}`
  ].join('\n');
}

/** Corta no limite sem cortar palavra no meio. */
function truncar(texto, limite = LIMITE_CARACTERES) {
  if (texto.length <= limite) return texto;
  const corte = texto.slice(0, limite);
  const ultimoEspaco = corte.lastIndexOf(' ');
  return (ultimoEspaco > limite * 0.7 ? corte.slice(0, ultimoEspaco) : corte).trim() + '…';
}

/** Primeira mensagem: o diagnóstico. */
async function gerarAbordagem(prospect) {
  const { texto, usage } = await chamarClaude(
    SYSTEM_ABORDAGEM,
    [{ role: 'user', content: fichaProspect(prospect) }],
    500
  );
  const { mensagem, assunto } = extrairJson(texto);
  return {
    mensagem: truncar(mensagem) + rodapeOptOut(),
    assunto: assunto || 'abordagem inicial',
    etapa: 1,
    tipo: 'diagnostico',
    usage
  };
}

/** Mensagens 2 a 4 da cadência. */
async function gerarFollowup(prospect, tipo) {
  const system = SYSTEM_FOLLOWUP[tipo];
  if (!system) throw new Error(`tipo de follow-up desconhecido: ${tipo}`);

  const contexto = [
    fichaProspect(prospect),
    '',
    'JÁ ENVIADO (não repita o texto nem o argumento):',
    ...(prospect.historicoContato || []).map((h, i) => `${i + 1}. ${h.mensagem || h.tipo}`)
  ].join('\n');

  const { texto, usage } = await chamarClaude(system, [{ role: 'user', content: contexto }], 400);
  const { mensagem } = extrairJson(texto);

  const etapa = (prospect.toques || 0) + 1;
  return {
    mensagem: truncar(mensagem) + rodapeOptOut(),
    etapa,
    tipo,
    usage
  };
}

/**
 * Proposta comercial formatada — enviada quando o prospect demonstra interesse.
 * Preço vem de config/planos.js: fonte única de verdade, nunca hardcoded aqui.
 */
function montarProposta(prospect, planoId = 'start') {
  const plano = getPlano(planoId);
  const nicho = getNicho(prospect.nicho).label.toLowerCase();

  return [
    `*Proposta — ${prospect.nome}*`,
    '',
    `Assistente de IA no WhatsApp de vocês, respondendo 24h por dia.`,
    '',
    `*O que faz:*`,
    `• Responde toda mensagem na hora, inclusive de madrugada e domingo`,
    `• Tira dúvidas sobre produtos, horários e localização`,
    `• Qualifica o cliente e avisa o vendedor no WhatsApp da loja certa`,
    `• Nunca deixa cliente sem resposta`,
    '',
    `*Plano ${plano.nome}:* R$ ${plano.precoMensal.toLocaleString('pt-BR')}/mês`,
    `• ${plano.limiteMensagens.toLocaleString('pt-BR')} mensagens/mês inclusas`,
    `• Excedente: R$ ${plano.precoPorMensagemExcedente.toFixed(2).replace('.', ',')} por mensagem`,
    `• Passou do limite? O bot continua respondendo. Nunca bloqueia.`,
    plano.relatorioSemanal ? `• Relatório semanal de atendimentos` : null,
    '',
    `Configuro tudo com o conteúdo da ${nicho} de vocês. Sem fidelidade.`,
    '',
    `Quer testar antes de decidir?`
  ].filter(l => l !== null).join('\n');
}

module.exports = { gerarAbordagem, gerarFollowup, montarProposta, truncar, extrairJson, LIMITE_CARACTERES };
