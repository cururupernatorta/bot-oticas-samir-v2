module.exports = {
  id: 'generico',
  nome: 'Comércio em geral',
  emoji: '🏪',
  categoria: 'coringa',
  nomeBotSugerido: 'Ana',
  vocabulario: { cliente: 'cliente', unidade: 'unidade', unidades: 'unidades', profissional: 'atendente' },
  objetivo: 'Responder dúvidas, qualificar o interesse e encaminhar o cliente para a unidade certa com um resumo pronto para o atendente.',
  descricaoTemplate: 'Empresa com atendimento presencial e por WhatsApp. Preencha aqui o que a empresa faz, onde atua e qual é o diferencial.',
  conhecimentoTemplate: `PRODUTOS/SERVIÇOS: (liste os principais)
FAIXAS DE PREÇO: (o que pode ser dito; o que só na loja)
FORMAS DE PAGAMENTO: (pix, cartão, parcelamento)
ENTREGA/PRAZOS: (se aplicável)
DIFERENCIAIS: (garantia, tempo de mercado, exclusividades)
PROMOÇÕES VIGENTES: (com data de validade)`,
  limites: `- Nunca invente preço, prazo, estoque ou disponibilidade.
- Não feche negociação nem conceda desconto: isso é do time humano.
- Não peça CPF, cartão, senha ou dado bancário.
- Se não souber, diga que vai confirmar e encaminhe para um atendente.`,
  qualificacao: [
    { campo: 'necessidade', pergunta: 'O que o cliente está procurando' },
    { campo: 'contexto', pergunta: 'Detalhes que ajudam o atendente (uso, quantidade, modelo)' },
    { campo: 'urgencia', pergunta: 'Para quando precisa' },
    { campo: 'unidade', pergunta: 'Qual unidade é mais conveniente' }
  ],
  faqBase: [
    { pergunta: 'Qual o horário de funcionamento?', resposta: '[preencher]', palavrasChave: ['horario', 'que horas', 'abre', 'fecha', 'funciona'] },
    { pergunta: 'Quais formas de pagamento vocês aceitam?', resposta: '[preencher]', palavrasChave: ['pagamento', 'pix', 'cartao', 'parcela', 'boleto'] },
    { pergunta: 'Onde vocês ficam?', resposta: '[preencher]', palavrasChave: ['endereco', 'onde fica', 'localizacao', 'como chegar'] },
    { pergunta: 'Vocês fazem entrega?', resposta: '[preencher]', palavrasChave: ['entrega', 'delivery', 'frete', 'entregam'] }
  ],
  gatilhosHumano: ['reclamação', 'cancelamento', 'problema com pedido já feito', 'pedido de desconto insistente'],
  kpis: ['Mensagens fora do horário respondidas', 'Leads qualificados/mês', 'Tempo até primeira resposta'],
  comercial: {
    planoSugerido: 'pro',
    volumeMensagensMes: '3.000 – 8.000',
    dorPrincipal: 'Cliente manda mensagem à noite e no fim de semana e ninguém responde. No dia seguinte já comprou em outro lugar.',
    argumentoDeAbertura: 'Quantas mensagens de WhatsApp vocês recebem fora do horário comercial? E quantas dessas viram venda?'
  }
};
