/**
 * PLANOS — fonte única de verdade (produto + comercial).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PREMISSAS DE CUSTO (revisar a cada 6 meses ou quando um fornecedor mudar)
 * ═══════════════════════════════════════════════════════════════════════════
 *  • IA: ~R$ 0,033 por mensagem (≈600 tokens entrada + 180 saída)
 *  • Z-API: ~R$ 75/mês por instância (1 instância por cliente)
 *  • Suporte humano: R$ 25 a R$ 60/mês por cliente, conforme o plano
 *  • Infra compartilhada (Render + Mongo + domínio + monitoramento): ~R$ 130/mês
 *    dividida entre os clientes ativos — a premissa abaixo é de 5 clientes.
 *    Com 20 clientes esse rateio cai para ~R$ 6,50 e a margem sobe sozinha.
 *
 * O plano ESSENCIAL existe porque o piso de R$ 900 fechava a porta para
 * barbearia, pet shop, assistência técnica e oficina pequena — que são
 * justamente os negócios mais fáceis de fechar e a melhor fonte de indicação.
 * Ele é rentável (margem ~56%) porque o custo variável de IA é baixo.
 *
 * A TAXA DE IMPLANTAÇÃO não é "extra": ela paga as 4 a 8 horas de onboarding
 * (ficha, base de conhecimento, testes, treinamento da equipe) e filtra
 * curioso. Nunca zere a implantação — no máximo, dilua em 2 ou 3 parcelas.
 */

const PLANOS = {
  essencial: {
    nome: 'Essencial',
    precoMensal: 397,
    taxaImplantacao: 697,
    limiteMensagens: 2500,
    precoPorMensagemExcedente: 0.35,
    relatorioSemanal: false,
    custoSuporte: 25,
    maxUnidades: 1,
    publico: 'Negócio de uma unidade, até ~50 conversas/dia',
    recursos: [
      'Atendimento 24h no WhatsApp',
      'FAQ instantâneo (sem custo de IA)',
      '1 unidade cadastrada',
      'Encaminhamento de lead com resumo',
      'Painel de leads',
      'Suporte por WhatsApp em horário comercial'
    ]
  },
  start: {
    nome: 'Start',
    precoMensal: 900,
    taxaImplantacao: 1200,
    limiteMensagens: 3000,
    precoPorMensagemExcedente: 0.30,
    relatorioSemanal: false,
    custoSuporte: 40,
    maxUnidades: 3,
    publico: 'Até 3 unidades, volume médio',
    recursos: [
      'Tudo do Essencial',
      'Até 3 unidades com roteamento automático',
      'Botão "Assumir atendimento" para a equipe',
      'Alerta de lead não respondido em 30 min',
      'Ajustes de conhecimento sob demanda'
    ]
  },
  pro: {
    nome: 'Pro',
    precoMensal: 1300,
    taxaImplantacao: 1800,
    limiteMensagens: 8000,
    precoPorMensagemExcedente: 0.30,
    relatorioSemanal: true,
    custoSuporte: 50,
    maxUnidades: 8,
    publico: 'Rede com várias unidades ou operação que investe em anúncio',
    recursos: [
      'Tudo do Start',
      'Até 8 unidades',
      'Relatório semanal de performance no WhatsApp do gestor',
      'Revisão mensal de conhecimento e FAQ',
      'Ajuste fino do roteiro de qualificação'
    ]
  },
  enterprise: {
    nome: 'Enterprise',
    precoMensal: 2000,
    taxaImplantacao: 2500,
    limiteMensagens: 20000,
    precoPorMensagemExcedente: 0.30,
    relatorioSemanal: true,
    custoSuporte: 60,
    maxUnidades: 999,
    publico: 'Alto volume: imobiliária, delivery, rede grande',
    recursos: [
      'Tudo do Pro',
      'Unidades ilimitadas',
      'Prioridade no suporte',
      'Reunião mensal de resultados',
      'Customização do roteiro por unidade'
    ]
  }
};

const CUSTO_IA_POR_MSG = 0.033;
const CUSTO_ZAPI = 75;
const CUSTO_INFRA_MENSAL = 130;

function getPlano(planoId) {
  return PLANOS[planoId] || PLANOS.pro;
}

/**
 * Análise financeira do plano.
 * @param {number} clientesAtivos  para ratear a infra fixa (padrão: 5)
 * @param {number} ocupacao        % do limite realmente consumido (padrão: 1 = pior caso)
 */
function getAnaliseFinanceira(planoId, clientesAtivos = 5, ocupacao = 1) {
  const plano = getPlano(planoId);

  const custoIa = plano.limiteMensagens * ocupacao * CUSTO_IA_POR_MSG;
  const custoInfra = CUSTO_INFRA_MENSAL / Math.max(1, clientesAtivos);
  const custoTotal = custoIa + CUSTO_ZAPI + plano.custoSuporte + custoInfra;
  const lucro = plano.precoMensal - custoTotal;

  return {
    receita: plano.precoMensal,
    taxaImplantacao: plano.taxaImplantacao,
    limiteMensagens: plano.limiteMensagens,
    precoPorMensagemExcedente: plano.precoPorMensagemExcedente,
    custoIa: custoIa.toFixed(2),
    custoZapi: CUSTO_ZAPI,
    custoSuporte: plano.custoSuporte,
    custoInfra: custoInfra.toFixed(2),
    custoTotal: custoTotal.toFixed(2),
    lucro: lucro.toFixed(2),
    margem: `${((lucro / plano.precoMensal) * 100).toFixed(1)}%`,
    lucroPorExcedente: (plano.precoPorMensagemExcedente - CUSTO_IA_POR_MSG).toFixed(2)
  };
}

/** Projeção de MRR e lucro para um mix de clientes. Ex.: { essencial: 10, pro: 5 } */
function projetarCarteira(mix = {}) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  let mrr = 0, custo = 0;

  for (const [planoId, qtd] of Object.entries(mix)) {
    if (!qtd) continue;
    const a = getAnaliseFinanceira(planoId, total);
    mrr += a.receita * qtd;
    custo += parseFloat(a.custoTotal) * qtd;
  }

  return {
    clientes: total,
    mrr: Math.round(mrr),
    custoMensal: Math.round(custo),
    lucroMensal: Math.round(mrr - custo),
    margem: mrr ? `${(((mrr - custo) / mrr) * 100).toFixed(1)}%` : '—',
    ticketMedio: total ? Math.round(mrr / total) : 0
  };
}

module.exports = {
  PLANOS, getPlano, getAnaliseFinanceira, projetarCarteira,
  CUSTO_IA_POR_MSG, CUSTO_ZAPI, CUSTO_INFRA_MENSAL
};
