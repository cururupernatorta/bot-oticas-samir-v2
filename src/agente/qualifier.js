const { chamarClaude } = require('../services/claudeService');
const { getNicho } = require('./config');
const { atualizarProspect } = require('../models/Prospect');

/**
 * QUALIFIER — decide quem vale a pena abordar.
 *
 * Desenho híbrido de propósito:
 *   1. Heurística determinística faz o corte grosso (barata, estável, auditável)
 *   2. Claude só entra nos sobreviventes, e não para dar nota — para achar
 *      o GANCHO: o motivo específico daquela empresa querer conversar.
 *
 * Chamar LLM para pontuar 200 prospects é caro e dá nota diferente a cada
 * rodada. Heurística não alucina e custa zero.
 */

// Fit do nicho com "atendimento 24h": volume de mensagens × ticket que paga R$ 900/mês
const FIT_NICHO = {
  otica: 85, clinica: 90, odonto: 90, estetica: 85,
  petshop: 75, academia: 70, imobiliaria: 80, autoescola: 65
};

/** Interpreta opening_hours do OSM: quantas horas por semana ficam DESCOBERTAS. */
function horasDescobertas(openingHours) {
  if (!openingHours) return null;
  const oh = openingHours.toLowerCase();
  if (oh.includes('24/7')) return 0;

  // Extrai todas as faixas HH:MM-HH:MM e soma
  const faixas = oh.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g) || [];
  if (!faixas.length) return null;

  let horasAbertas = 0;
  for (const f of faixas) {
    const [ini, fim] = f.split('-').map(s => s.trim());
    const [hi, mi] = ini.split(':').map(Number);
    const [hf, mf] = fim.split(':').map(Number);
    horasAbertas += (hf + mf / 60) - (hi + mi / 60);
  }
  // Aproximação: a faixa se repete nos dias que ela cobre. Sem parser completo
  // de opening_hours, assumimos ~6 dias úteis — suficiente para ordenar prospects.
  const estimativaSemanal = horasAbertas * 6;
  return Math.max(0, Math.round(168 - estimativaSemanal));
}

/**
 * Score 0–100. Quanto maior, maior a dor que o bot resolve.
 * Retorna também os sinais, porque score sem motivo é adivinhação.
 */
function calcularScore(prospect) {
  const sinais = [];
  let score = FIT_NICHO[prospect.nicho] ?? 60;
  sinais.push(`nicho ${getNicho(prospect.nicho).label}: fit base ${score}`);

  // Já usa WhatsApp como canal declarado → não precisa ser convencido do canal
  if (prospect.temWhatsappDeclarado) {
    score += 10;
    sinais.push('já declara WhatsApp como canal de contato (+10)');
  }

  // Horário limitado = mensagens caindo no vazio fora do expediente
  const descobertas = horasDescobertas(prospect.horarioPublicado);
  if (descobertas !== null && descobertas > 100) {
    score += 12;
    sinais.push(`~${descobertas}h/semana fora do horário sem ninguém respondendo (+12)`);
  } else if (descobertas !== null && descobertas > 80) {
    score += 6;
    sinais.push(`~${descobertas}h/semana descobertas (+6)`);
  }

  // Sem site = presença digital fraca; o WhatsApp É o canal principal
  if (!prospect.site) {
    score += 8;
    sinais.push('sem site — WhatsApp é a porta de entrada principal (+8)');
  }

  // Endereço completo = cadastro cuidado, empresa estabelecida
  if (prospect.endereco) {
    score += 5;
    sinais.push('endereço completo — negócio estabelecido (+5)');
  }

  // Fixo em vez de celular: menor chance de o número ter WhatsApp ativo
  if (!prospect.temWhatsappDeclarado && prospect.telefone && prospect.telefone.length === 12) {
    score -= 15;
    sinais.push('só telefone fixo — pode não ter WhatsApp (-15)');
  }

  return { score: Math.max(0, Math.min(100, score)), sinais };
}

const SYSTEM_GANCHO = `Você é analista de pré-vendas de uma empresa que vende bot de atendimento 24h no WhatsApp para comércio local brasileiro.

Sua tarefa: dado o cadastro público de UMA empresa, escrever o GANCHO — o motivo específico e concreto pelo qual ELA perderia dinheiro sem atendimento fora do horário.

REGRAS DURAS:
- Máximo 2 frases.
- Use APENAS os dados fornecidos. Nunca invente número de clientes, faturamento, avaliações ou reclamações.
- Nada de "revolucionar", "potencializar", "alavancar". Português direto de quem entende do negócio.
- Fale da dor concreta do nicho, não do produto.

Responda SOMENTE com JSON válido, sem markdown:
{"gancho":"...","dorPrincipal":"...","confianca":"alta|media|baixa"}`;

async function gerarGancho(prospect, sinais) {
  const ficha = [
    `Nome: ${prospect.nome}`,
    `Ramo: ${getNicho(prospect.nicho).label}`,
    `Cidade: ${prospect.cidade}`,
    `Endereço: ${prospect.endereco || 'não informado'}`,
    `Site: ${prospect.site || 'NÃO TEM SITE'}`,
    `Horário publicado: ${prospect.horarioPublicado || 'não informado'}`,
    `Sinais detectados: ${sinais.join('; ')}`
  ].join('\n');

  try {
    const { texto, usage } = await chamarClaude(
      SYSTEM_GANCHO,
      [{ role: 'user', content: ficha }],
      300
    );
    const limpo = texto.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(limpo);
    return { ...parsed, usage };
  } catch (err) {
    console.error(`[QUALIFIER] gancho falhou para ${prospect.nome}:`, err.message);
    // Degradação graciosa: o pipeline continua com o sinal heurístico mais forte.
    return {
      gancho: sinais[1] || sinais[0] || 'Perfil compatível com atendimento 24h.',
      dorPrincipal: 'mensagens fora do horário sem resposta',
      confianca: 'baixa',
      usage: { input_tokens: 0, output_tokens: 0 }
    };
  }
}

/** Qualifica um prospect: score heurístico + gancho do Claude. Persiste. */
async function qualificar(prospect) {
  const { score, sinais } = calcularScore(prospect);

  // Abaixo de 50 nem gasta token de LLM.
  if (score < 50) {
    await atualizarProspect(prospect.chaveUnica, {
      status: 'descartado', score, motivoScore: sinais, descartadoEm: new Date()
    });
    return { ...prospect, score, status: 'descartado' };
  }

  const gancho = await gerarGancho(prospect, sinais);
  const updates = {
    status: 'qualificado',
    score,
    motivoScore: sinais,
    gancho: gancho.gancho,
    dorPrincipal: gancho.dorPrincipal,
    confiancaGancho: gancho.confianca,
    qualificadoEm: new Date()
  };
  await atualizarProspect(prospect.chaveUnica, updates);
  return { ...prospect, ...updates };
}

module.exports = { qualificar, calcularScore, horasDescobertas, gerarGancho };
