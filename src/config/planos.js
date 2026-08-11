/**
 * PLANOS — Fonte única de verdade
 *
 * Preço excedente fixo: R$ 0,30 por mensagem
 *
 * ═══════════════════════════════════════════════════════════════
 * ANÁLISE DE CUSTO MÉDIO DE INFRA E LUCRO POR PLANO
 * ═══════════════════════════════════════════════════════════════
 *
 * Premissas de custo (estimativas realistas para operação):
 * • Custo IA Claude: ~R$ 0,033/msg (600 input + 180 output tokens)
 * • Custo Z-API por instância: ~R$ 75/mês
 * • Custo suporte técnico: ~R$ 50/mês por cliente
 * • Custo infra (Render + Mongo + domínio + monitoramento): ~R$ 130/mês
 *   → Dividido entre clientes ativos (assumindo 5 clientes = R$ 26/cliente)
 *
 * ┌─────────────┬──────────┬─────────┬─────────────┬──────────┬─────────┐
 * │   PLANO     │ RECEITA  │  MSGS   │ CUSTO TOTAL │  LUCRO   │ MARGEM  │
 * ├─────────────┼──────────┼─────────┼─────────────┼──────────┼─────────┤
 * │ Start       │ R$ 900   │  3.000  │   R$ 250    │ R$ 650   │  72,2%  │
 * │ Pro         │ R$ 1.300 │  8.000  │   R$ 415    │ R$ 885   │  68,1%  │
 * │ Enterprise  │ R$ 2.000 │ 20.000  │   R$ 811    │ R$ 1.189 │  59,5%  │
 * └─────────────┴──────────┴─────────┴─────────────┴──────────┴─────────┘
 *
 * CENÁRIO COM 20% DE EXCEDENTE (R$ 0,30/msg):
 * • Start:      +600 msgs  → +R$ 180 receita → lucro sobe para R$ 810
 * • Pro:        +1.600 msgs → +R$ 480 receita → lucro sobe para R$ 1.312
 * • Enterprise: +4.000 msgs → +R$ 1.200 receita → lucro sobe para R$ 2.257
 *
 * ═══════════════════════════════════════════════════════════════
 */

const PLANOS = {
  start: {
    nome: 'Start',
    precoMensal: 900,
    limiteMensagens: 3000,
    precoPorMensagemExcedente: 0.30,
    relatorioSemanal: false
  },
  pro: {
    nome: 'Pro',
    precoMensal: 1300,
    limiteMensagens: 8000,
    precoPorMensagemExcedente: 0.30,
    relatorioSemanal: true
  },
  enterprise: {
    nome: 'Enterprise',
    precoMensal: 2000,
    limiteMensagens: 20000,
    precoPorMensagemExcedente: 0.30,
    relatorioSemanal: true
  }
};

function getPlano(planoId) {
  return PLANOS[planoId] || PLANOS.pro;
}

/**
 * Retorna análise financeira do plano para exibição no admin
 */
function getAnaliseFinanceira(planoId) {
  const plano = getPlano(planoId);

  // Custos estimados (mesmas premissas dos comentários acima)
  const custoIaPorMsg = 0.033;
  const custoZapi = 75;
  const custoSuporte = 50;
  const custoInfraPorCliente = 26;

  const custoIa = plano.limiteMensagens * custoIaPorMsg;
  const custoTotal = custoIa + custoZapi + custoSuporte + custoInfraPorCliente;
  const lucro = plano.precoMensal - custoTotal;
  const margem = ((lucro / plano.precoMensal) * 100).toFixed(1);

  return {
    receita: plano.precoMensal,
    custoIa: custoIa.toFixed(2),
    custoZapi,
    custoSuporte,
    custoInfra: custoInfraPorCliente,
    custoTotal: custoTotal.toFixed(2),
    lucro: lucro.toFixed(2),
    margem: `${margem}%`,
    lucroPorExcedente: (0.30 - custoIaPorMsg).toFixed(2)
  };
}

module.exports = { PLANOS, getPlano, getAnaliseFinanceira };
