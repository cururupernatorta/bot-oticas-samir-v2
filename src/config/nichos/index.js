/**
 * CATÁLOGO DE NICHOS
 *
 * Um pacote de nicho é o "molde" que transforma a plataforma genérica no
 * atendente daquele segmento: vocabulário, objetivo, roteiro de qualificação,
 * guardrails de compliance, FAQ inicial e KPIs.
 *
 * O cliente é sempre livre para sobrescrever qualquer campo — o pacote só
 * define o ponto de partida do onboarding (o que economiza horas de setup).
 *
 * Para criar um nicho novo: copie um arquivo deste diretório, ajuste os campos
 * e pronto — ele aparece sozinho no painel e no CLI.
 */

const fs = require('fs');
const path = require('path');

const PACOTES = {};

for (const arquivo of fs.readdirSync(__dirname)) {
  if (!arquivo.endsWith('.js') || arquivo === 'index.js') continue;
  const pacote = require(path.join(__dirname, arquivo));
  if (!pacote || !pacote.id) {
    console.warn(`[NICHOS] Ignorado (sem id): ${arquivo}`);
    continue;
  }
  PACOTES[pacote.id] = pacote;
}

const PADRAO = PACOTES.generico;

function getNicho(id) {
  return PACOTES[id] || PADRAO;
}

/** Lista enxuta para popular selects no painel. */
function listarNichos() {
  return Object.values(PACOTES)
    .sort((a, b) => (a.id === 'generico' ? -1 : b.id === 'generico' ? 1 : a.nome.localeCompare(b.nome, 'pt-BR')))
    .map(n => ({
      id: n.id,
      nome: n.nome,
      emoji: n.emoji,
      categoria: n.categoria,
      nomeBotSugerido: n.nomeBotSugerido,
      planoSugerido: n.comercial?.planoSugerido || 'pro',
      volumeMensagensMes: n.comercial?.volumeMensagensMes || '',
      dorPrincipal: n.comercial?.dorPrincipal || ''
    }));
}

/**
 * Devolve os campos que o painel deve pré-preencher ao escolher um nicho.
 * Nada é gravado aqui — quem grava é o Client model.
 */
function sugestoesDoNicho(id) {
  const n = getNicho(id);
  return {
    id: n.id,
    nome: n.nome,
    emoji: n.emoji,
    nomeBot: n.nomeBotSugerido,
    descricao: n.descricaoTemplate,
    conhecimento: n.conhecimentoTemplate,
    limites: n.limites,
    faq: (n.faqBase || []).map(f => ({ ...f })),
    qualificacao: n.qualificacao || [],
    vocabulario: n.vocabulario,
    objetivo: n.objetivo,
    gatilhosHumano: n.gatilhosHumano || [],
    kpis: n.kpis || [],
    comercial: n.comercial || {}
  };
}

/**
 * Mescla os dados enviados no cadastro com o pacote do nicho.
 * Regra: o que o usuário preencheu SEMPRE vence. O pacote só preenche buraco.
 */
function aplicarNicho(dados = {}) {
  const n = getNicho(dados.nicho);
  const vazio = v => v === undefined || v === null || (typeof v === 'string' && !v.trim()) ||
                     (Array.isArray(v) && v.length === 0);

  return {
    ...dados,
    nicho: n.id,
    nomeBot: vazio(dados.nomeBot) ? n.nomeBotSugerido : dados.nomeBot,
    descricao: vazio(dados.descricao) ? n.descricaoTemplate : dados.descricao,
    conhecimento: vazio(dados.conhecimento) ? n.conhecimentoTemplate : dados.conhecimento,
    limites: vazio(dados.limites) ? n.limites : dados.limites,
    faq: vazio(dados.faq) ? (n.faqBase || []).map(f => ({ ...f })) : dados.faq,
    qualificacao: vazio(dados.qualificacao) ? (n.qualificacao || []) : dados.qualificacao,
    vocabulario: dados.vocabulario || n.vocabulario,
    objetivo: vazio(dados.objetivo) ? n.objetivo : dados.objetivo,
    gatilhosHumano: vazio(dados.gatilhosHumano) ? (n.gatilhosHumano || []) : dados.gatilhosHumano
  };
}

module.exports = { PACOTES, getNicho, listarNichos, sugestoesDoNicho, aplicarNicho };
