const { enviarWhatsApp } = require('../services/zapiService');
const { AGENTE } = require('./config');
const { podeContatar, auditar, registrarOptOut, detectaOptOut } = require('./compliance');
const { gerarAbordagem, gerarFollowup } = require('./mensageiro');
const {
  atualizarProspect, registrarToque, filaAprovacao,
  listarProspects, getProspect
} = require('../models/Prospect');

/**
 * OUTREACH — o único lugar do sistema que fala com o mundo.
 *
 * Duas travas separam "agente autônomo" de "máquina de queimar número":
 *
 *   1. COMPLIANCE  — podeContatar() é obrigatório e não tem bypass
 *   2. APROVAÇÃO   — no modo 'manual' o agente escreve e PARA. Você revisa.
 *
 * O modo 'auto' existe, mas só deve ser ligado depois de ~50 aprovações
 * manuais, quando você já sabe como o agente escreve. Autonomia se conquista
 * com histórico, não com flag no .env.
 */

function temInstanciaConfigurada() {
  return Boolean(AGENTE.zapi.instanceId && AGENTE.zapi.token);
}

/** Escreve a mensagem e deixa na fila. NÃO envia. */
async function prepararAbordagem(prospect) {
  if (prospect.score < AGENTE.limites.scoreMinimoParaAbordar) {
    return { preparado: false, motivo: `score ${prospect.score} abaixo do mínimo ${AGENTE.limites.scoreMinimoParaAbordar}` };
  }

  try {
    const { mensagem, etapa, tipo, usage } = await gerarAbordagem(prospect);
    await atualizarProspect(prospect.chaveUnica, {
      mensagemPendente: mensagem,
      etapaPendente: etapa,
      tipoPendente: tipo,
      preparadoEm: new Date(),
      tokensGastos: (prospect.tokensGastos || 0) + (usage?.input_tokens || 0) + (usage?.output_tokens || 0)
    });
    return { preparado: true, mensagem, etapa, tipo };
  } catch (err) {
    console.error(`[OUTREACH] falha ao preparar ${prospect.nome}:`, err.message);
    return { preparado: false, motivo: err.message };
  }
}

/**
 * Envia de fato. Passa pelo compliance SEMPRE, inclusive quando aprovado
 * manualmente — aprovação humana não revoga opt-out nem janela de contato.
 */
async function enviar(prospect, mensagem, meta = {}) {
  const gate = await podeContatar(prospect.telefone);
  if (!gate.permitido) {
    await auditar('bloqueio', {
      chaveUnica: prospect.chaveUnica, telefone: prospect.telefone, motivo: gate.motivo
    });
    return { enviado: false, motivo: gate.motivo };
  }

  if (!temInstanciaConfigurada()) {
    return { enviado: false, motivo: 'AGENTE_ZAPI_INSTANCE/TOKEN não configurados' };
  }

  await enviarWhatsApp(AGENTE.zapi.instanceId, AGENTE.zapi.token, prospect.telefone, mensagem);

  await registrarToque(prospect.chaveUnica, {
    mensagem, etapa: meta.etapa || 1, tipo: meta.tipo || 'diagnostico', canal: 'whatsapp'
  });
  await atualizarProspect(prospect.chaveUnica, {
    status: 'abordado', mensagemPendente: null, etapaPendente: null, tipoPendente: null
  });
  await auditar('envio', {
    chaveUnica: prospect.chaveUnica, telefone: prospect.telefone,
    nome: prospect.nome, etapa: meta.etapa || 1, tipo: meta.tipo || 'diagnostico'
  });

  console.log(`[OUTREACH] enviado → ${prospect.nome} (${prospect.telefone}) etapa ${meta.etapa || 1}`);
  return { enviado: true };
}

/** Aprovação humana de um item da fila. */
async function aprovarEEnviar(chaveUnica) {
  const p = await getProspect(chaveUnica);
  if (!p) return { enviado: false, motivo: 'prospect não encontrado' };
  if (!p.mensagemPendente) return { enviado: false, motivo: 'nada pendente para este prospect' };

  return await enviar(p, p.mensagemPendente, { etapa: p.etapaPendente, tipo: p.tipoPendente });
}

async function rejeitar(chaveUnica, motivo = 'rejeitado manualmente') {
  await atualizarProspect(chaveUnica, {
    status: 'rejeitado', mensagemPendente: null, etapaPendente: null,
    tipoPendente: null, motivoRejeicao: motivo, rejeitadoEm: new Date()
  });
  await auditar('rejeicao', { chaveUnica, motivo });
  return { rejeitado: true };
}

/**
 * Despacha a fila respeitando o intervalo entre envios.
 * Em modo manual, só roda para itens já aprovados explicitamente.
 */
async function despacharFila({ limite = 10, forcar = false } = {}) {
  if (AGENTE.modo === 'manual' && !forcar) {
    const fila = await filaAprovacao(limite);
    return { modo: 'manual', aguardandoAprovacao: fila.length, enviados: 0 };
  }

  const fila = await filaAprovacao(limite);
  let enviados = 0, bloqueados = 0;

  for (const p of fila) {
    const r = await enviar(p, p.mensagemPendente, { etapa: p.etapaPendente, tipo: p.tipoPendente });
    if (r.enviado) {
      enviados++;
      await new Promise(res => setTimeout(res, AGENTE.limites.intervaloMinEntreEnviosMs));
    } else {
      bloqueados++;
      // Limite atingido ou fora da janela: parar o lote inteiro, não insistir.
      if (r.motivo.includes('limite') || r.motivo.includes('janela')) break;
    }
  }

  return { modo: AGENTE.modo, enviados, bloqueados };
}

/**
 * Trata resposta recebida de um prospect.
 * Opt-out tem prioridade absoluta sobre qualquer intenção comercial.
 */
async function processarResposta(telefone, texto) {
  if (detectaOptOut(texto)) {
    await registrarOptOut(telefone, 'resposta do prospect');
    const [p] = await listarProspects({ telefone }, 1);
    if (p) {
      await atualizarProspect(p.chaveUnica, { status: 'descadastrado', descadastradoEm: new Date() });
      await auditar('optout', { chaveUnica: p.chaveUnica, telefone, texto });
    }
    return { acao: 'optout', responder: false };
  }

  const [p] = await listarProspects({ telefone }, 1);
  if (!p) return { acao: 'desconhecido', responder: false };

  // Respondeu: cadência para aqui. Daqui em diante é conversa humana.
  await atualizarProspect(p.chaveUnica, {
    status: 'respondeu', respondeuEm: new Date(), primeiraResposta: texto
  });
  await auditar('resposta', { chaveUnica: p.chaveUnica, telefone, texto });

  console.log(`[OUTREACH] 🔥 ${p.nome} respondeu: "${String(texto).slice(0, 80)}"`);
  return { acao: 'respondeu', prospect: p, responder: true };
}

/** Próximo toque da cadência para quem não respondeu. */
async function prepararFollowup(prospect) {
  const proximaEtapa = (prospect.toques || 0) + 1;
  const passo = AGENTE.cadencia.find(c => c.etapa === proximaEtapa);

  if (!passo || proximaEtapa > AGENTE.maxToques) {
    await atualizarProspect(prospect.chaveUnica, { status: 'esgotado', esgotadoEm: new Date() });
    return { preparado: false, motivo: 'cadência esgotada' };
  }

  try {
    const { mensagem, etapa, tipo } = await gerarFollowup(prospect, passo.tipo);
    await atualizarProspect(prospect.chaveUnica, {
      mensagemPendente: mensagem, etapaPendente: etapa, tipoPendente: tipo, preparadoEm: new Date()
    });
    return { preparado: true, etapa, tipo };
  } catch (err) {
    console.error(`[OUTREACH] follow-up falhou para ${prospect.nome}:`, err.message);
    return { preparado: false, motivo: err.message };
  }
}

module.exports = {
  prepararAbordagem, prepararFollowup, enviar, aprovarEEnviar,
  rejeitar, despacharFila, processarResposta, temInstanciaConfigurada
};
