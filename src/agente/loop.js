const cron = require('node-cron');
const { AGENTE } = require('./config');
const { rodarProspeccao } = require('./prospector');
const { qualificar } = require('./qualifier');
const { prepararAbordagem, prepararFollowup, despacharFila } = require('./outreach');
const { listarProspects, prontosParaFollowup, contarPorStatus } = require('../models/Prospect');
const { auditar, dentroDaJanela } = require('./compliance');

/**
 * LOOP — o ciclo autônomo.
 *
 * Cada etapa é independente e falha isolada: se a prospecção cair, a
 * qualificação do que já existe continua rodando. Um agente que roda sozinho
 * não pode ter etapa que derruba as outras.
 *
 * Ordem deliberada — descobrir → qualificar → escrever → despachar → seguir:
 * o trabalho caro (LLM) só acontece sobre o que passou no filtro barato.
 */

async function etapaProspeccao() {
  const novos = await rodarProspeccao();
  return { novos: novos.length };
}

async function etapaQualificacao() {
  const pendentes = await listarProspects(
    { status: 'descoberto' },
    AGENTE.limites.qualificacoesPorCiclo
  );

  let qualificados = 0, descartados = 0;
  for (const p of pendentes) {
    const r = await qualificar(p);
    if (r.status === 'qualificado') qualificados++; else descartados++;
  }
  return { analisados: pendentes.length, qualificados, descartados };
}

async function etapaRedacao() {
  const prontos = await listarProspects(
    {
      status: 'qualificado',
      score: { $gte: AGENTE.limites.scoreMinimoParaAbordar },
      mensagemPendente: { $in: [null, undefined] }
    },
    10
  );

  let escritas = 0;
  for (const p of prontos) {
    const r = await prepararAbordagem(p);
    if (r.preparado) escritas++;
  }
  return { escritas };
}

async function etapaFollowup() {
  let preparados = 0;
  for (const passo of AGENTE.cadencia.filter(c => c.etapa > 1)) {
    const alvos = await prontosParaFollowup(passo.aposDias, passo.etapa);
    for (const p of alvos) {
      const r = await prepararFollowup(p);
      if (r.preparado) preparados++;
    }
  }
  return { preparados };
}

/** Executa um ciclo completo. Cada etapa protegida — nenhuma derruba o loop. */
async function rodarCiclo({ pularProspeccao = false } = {}) {
  const inicio = Date.now();
  const rel = { em: new Date(), modo: AGENTE.modo, etapas: {}, erros: [] };

  const etapas = [
    ['prospeccao',   () => (pularProspeccao ? { pulada: true } : etapaProspeccao())],
    ['qualificacao', etapaQualificacao],
    ['redacao',      etapaRedacao],
    ['followup',     etapaFollowup],
    ['despacho',     () => despacharFila({ limite: 10 })]
  ];

  for (const [nome, fn] of etapas) {
    try {
      rel.etapas[nome] = await fn();
    } catch (err) {
      console.error(`[LOOP] etapa ${nome} falhou:`, err.message);
      rel.etapas[nome] = { erro: err.message };
      rel.erros.push(nome);
    }
  }

  rel.funil = await contarPorStatus().catch(() => ({}));
  rel.duracaoSegundos = Math.round((Date.now() - inicio) / 1000);

  await auditar('ciclo', rel);
  console.log('[LOOP] ciclo concluído:', JSON.stringify(rel.etapas));
  return rel;
}

/**
 * Agenda o ciclo. Só roda dentro da janela de contato — não faz sentido
 * escrever abordagem às 3h da manhã se ninguém pode enviá-la.
 */
function iniciarAgente() {
  if (!AGENTE.ativo) {
    console.log('🤖 Agente de aquisição: DESLIGADO (AGENTE_ATIVO != true)');
    return;
  }

  // A cada 2h em dia útil, das 9h às 17h (horário de São Paulo)
  cron.schedule('0 9-17/2 * * 1-5', async () => {
    if (!dentroDaJanela()) return;
    console.log('🤖 [AGENTE] iniciando ciclo agendado...');
    await rodarCiclo();
  }, { timezone: AGENTE.janelaContato.timezone });

  console.log(`🤖 Agente de aquisição: LIGADO em modo ${AGENTE.modo.toUpperCase()}`);
  console.log(`   Cidades: ${AGENTE.cidades.join(', ')}`);
  console.log(`   Limite: ${AGENTE.limites.enviosPorDia} envios/dia, ${AGENTE.limites.enviosPorHora}/hora`);
  if (AGENTE.modo === 'manual') {
    console.log('   ⏸  Modo manual: mensagens ficam na fila em /admin/agente até você aprovar');
  }
}

module.exports = {
  iniciarAgente, rodarCiclo,
  etapaProspeccao, etapaQualificacao, etapaRedacao, etapaFollowup
};
