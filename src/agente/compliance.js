const { getDB } = require('../config/database');
const { AGENTE } = require('./config');

const COL_OPTOUT = 'optout';
const COL_AUDIT = 'agente_auditoria';

/**
 * COMPLIANCE — o que impede o agente autônomo de virar problema jurídico.
 *
 * Base legal da prospecção B2B no Brasil: LGPD art. 7º, IX (legítimo interesse).
 * Ela NÃO exige consentimento prévio para contato comercial B2B, mas exige
 * três coisas que este módulo garante mecanicamente:
 *
 *   1. FINALIDADE  — só dado de contato comercial público, só oferta pertinente
 *   2. NECESSIDADE — o mínimo: nome, telefone comercial, ramo
 *   3. BALANCEAMENTO — opt-out fácil, imediato e PERMANENTE
 *
 * Mais: ANPD ativa fiscalização desde 2025, multa até 2% do faturamento
 * (teto R$ 50 mi). Agente rodando sozinho sem estes freios é risco real,
 * não teórico. Nenhum envio acontece sem passar por podeContatar().
 */

// Se a pessoa escreveu qualquer uma destas, o agente para para sempre.
const FRASES_OPTOUT = [
  'não quero', 'nao quero', 'para de', 'pare de', 'descadastr', 'sair da lista',
  'remove', 'remover', 'não me mande', 'nao me mande', 'não envie', 'nao envie',
  'stop', 'cancelar', 'não tenho interesse', 'nao tenho interesse', 'spam',
  'me tira', 'não perturbe', 'nao perturbe', 'bloquear'
];

// Palavras curtas que só valem como resposta ISOLADA. "sair" dentro de
// "vou sair agora" não é recusa; "SAIR" sozinho é — e é exatamente o que o
// rodapé de opt-out manda a pessoa responder.
const PALAVRAS_OPTOUT_EXATAS = ['sair', 'stop', 'parar', 'pare', 'remover', 'cancelar', 'nao', 'não'];

function detectaOptOut(texto) {
  if (!texto) return false;
  const t = String(texto).toLowerCase().trim();

  // Resposta curta e isolada: "SAIR", "stop", "parar"
  const limpo = t.replace(/[.!,;\s]+$/g, '');
  if (PALAVRAS_OPTOUT_EXATAS.includes(limpo)) return true;

  return FRASES_OPTOUT.some(f => t.includes(f));
}

async function registrarOptOut(telefone, origem = 'resposta') {
  await getDB().collection(COL_OPTOUT).updateOne(
    { telefone },
    { $set: { telefone, origem, em: new Date() } },
    { upsert: true }
  );
  console.log(`[COMPLIANCE] opt-out registrado: ${telefone} (${origem})`);
}

async function estaNoOptOut(telefone) {
  return Boolean(await getDB().collection(COL_OPTOUT).findOne({ telefone }));
}

/** Hora local de São Paulo, independente do fuso do servidor (Render roda em UTC). */
function agoraLocal() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: AGENTE.janelaContato.timezone,
    hour: 'numeric', weekday: 'short', hour12: false
  });
  const partes = fmt.formatToParts(new Date());
  const hora = parseInt(partes.find(p => p.type === 'hour').value, 10);
  const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const diaSemana = dias[partes.find(p => p.type === 'weekday').value];
  return { hora, diaSemana };
}

function dentroDaJanela() {
  const { hora, diaSemana } = agoraLocal();
  const j = AGENTE.janelaContato;
  return j.diasSemana.includes(diaSemana) && hora >= j.horaInicio && hora < j.horaFim;
}

async function enviosNasUltimas(horas) {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000);
  return await getDB().collection(COL_AUDIT).countDocuments({ acao: 'envio', em: { $gte: desde } });
}

/**
 * Portão único de saída. Toda mensagem passa por aqui.
 * Retorna { permitido, motivo } — nunca lança, para não derrubar o loop.
 */
async function podeContatar(telefone) {
  try {
    if (!telefone) return { permitido: false, motivo: 'sem telefone' };

    if (await estaNoOptOut(telefone)) {
      return { permitido: false, motivo: 'telefone em opt-out — permanente' };
    }
    if (!dentroDaJanela()) {
      const { hora, diaSemana } = agoraLocal();
      return { permitido: false, motivo: `fora da janela de contato (dia ${diaSemana}, ${hora}h)` };
    }

    const noDia = await enviosNasUltimas(24);
    if (noDia >= AGENTE.limites.enviosPorDia) {
      return { permitido: false, motivo: `limite diário atingido (${noDia}/${AGENTE.limites.enviosPorDia})` };
    }

    const naHora = await enviosNasUltimas(1);
    if (naHora >= AGENTE.limites.enviosPorHora) {
      return { permitido: false, motivo: `limite horário atingido (${naHora}/${AGENTE.limites.enviosPorHora})` };
    }

    return { permitido: true, motivo: 'ok' };
  } catch (err) {
    // Falha de infra nunca pode virar envio. Na dúvida, não envia.
    console.error('[COMPLIANCE] erro na verificação, bloqueando por segurança:', err.message);
    return { permitido: false, motivo: 'erro na verificação de compliance' };
  }
}

/** Trilha de auditoria: quem o agente contatou, quando e com o quê. */
async function auditar(acao, dados) {
  try {
    await getDB().collection(COL_AUDIT).insertOne({ acao, ...dados, em: new Date() });
  } catch (err) {
    console.error('[COMPLIANCE] falha ao auditar:', err.message);
  }
}

/** Rodapé obrigatório de opt-out. Sem isso o legítimo interesse não se sustenta. */
function rodapeOptOut() {
  return '\n\nSe não quiser receber mais mensagens, é só responder "SAIR" que eu não te chamo mais.';
}

module.exports = {
  podeContatar, registrarOptOut, estaNoOptOut, detectaOptOut,
  dentroDaJanela, auditar, rodapeOptOut, agoraLocal, FRASES_OPTOUT, PALAVRAS_OPTOUT_EXATAS
};
