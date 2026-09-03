module.exports = {
  id: 'moveis-decoracao',
  nome: 'Móveis planejados, decoração e casa',
  emoji: '🛋️',
  categoria: 'alto-ticket',
  nomeBotSugerido: 'Isa',
  vocabulario: { cliente: 'cliente', unidade: 'loja', unidades: 'lojas', profissional: 'projetista' },
  objetivo: 'Qualificar o projeto (ambientes, prazo, faixa de investimento) e agendar visita ao showroom ou medição.',
  descricaoTemplate: 'Loja de móveis planejados/decoração com [N] loja(s), projeto sob medida e montagem própria.',
  conhecimentoTemplate: `PRODUTOS: planejados (cozinha, dormitório, closet, home office), soltos, estofados, decoração.
COMO FUNCIONA O PROJETO: visita, medição, projeto 3D, prazo de produção e montagem.
FAIXA DE INVESTIMENTO POR AMBIENTE: (o que pode ser dito)
PRAZO: da assinatura até a montagem.
GARANTIA E ASSISTÊNCIA:
PAGAMENTO: entrada, parcelamento, financiamento.
ÁREA DE ATENDIMENTO: cidades atendidas.`,
  limites: `- Não passe preço fechado: planejado depende de projeto e medidas.
- Não prometa prazo de entrega/montagem sem confirmação.
- Não faça projeto nem sugira solução técnica por mensagem.
- Não negocie condição de pagamento.`,
  qualificacao: [
    { campo: 'ambiente', pergunta: 'Quais ambientes quer planejar' },
    { campo: 'estagio', pergunta: 'Obra em que fase (planta, obra, pronto para medir)' },
    { campo: 'investimento', pergunta: 'Faixa de investimento pretendida' },
    { campo: 'prazo', pergunta: 'Para quando precisa ficar pronto' },
    { campo: 'unidade', pergunta: 'Qual loja / cidade do imóvel' }
  ],
  faqBase: [
    { pergunta: 'Quanto custa uma cozinha planejada?', resposta: '[preencher: depende do projeto]', palavrasChave: ['quanto custa', 'preco', 'valor', 'cozinha planejada'] },
    { pergunta: 'Vocês fazem o projeto 3D gratuito?', resposta: '[preencher]', palavrasChave: ['projeto', '3d', 'gratuito', 'sem compromisso'] },
    { pergunta: 'Qual o prazo de entrega?', resposta: '[preencher]', palavrasChave: ['prazo', 'entrega', 'quanto tempo', 'montagem'] },
    { pergunta: 'Vocês atendem minha cidade?', resposta: '[preencher]', palavrasChave: ['atendem', 'cidade', 'regiao', 'entregam em'] }
  ],
  gatilhosHumano: ['negociação de valor', 'atraso de entrega', 'assistência técnica', 'alteração de projeto assinado'],
  kpis: ['Visitas ao showroom agendadas', 'Medições agendadas', 'Valor potencial dos leads'],
  comercial: {
    planoSugerido: 'pro',
    volumeMensagensMes: '2.500 – 7.000',
    dorPrincipal: 'Ticket alto e ciclo longo: um lead perdido por falta de resposta custa dezenas de milhares de reais.',
    argumentoDeAbertura: 'Qual o seu ticket médio de projeto? Um único lead salvo por mês já paga o sistema várias vezes.'
  }
};
