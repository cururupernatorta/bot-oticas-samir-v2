module.exports = {
  id: 'restaurante-delivery',
  nome: 'Restaurantes, pizzarias e delivery',
  emoji: '🍕',
  categoria: 'alto-volume',
  nomeBotSugerido: 'Duda',
  vocabulario: { cliente: 'cliente', unidade: 'loja', unidades: 'lojas', profissional: 'atendente' },
  objetivo: 'Responder cardápio, horário, área de entrega e taxas, e encaminhar o pedido para o atendente ou para o link de pedido.',
  descricaoTemplate: 'Restaurante/delivery com [N] loja(s). Atendimento no salão, retirada e entrega.',
  conhecimentoTemplate: `CARDÁPIO E PREÇOS: (ou link do cardápio digital)
ÁREA DE ENTREGA E TAXAS: por bairro.
TEMPO MÉDIO DE ENTREGA: por faixa de horário.
PEDIDO MÍNIMO:
FORMAS DE PAGAMENTO: pix, cartão na entrega, vale-refeição (quais bandeiras).
PROMOÇÕES DO DIA/SEMANA:
RESERVAS: aceita? para quantas pessoas?
RESTRIÇÕES: opções vegetarianas, sem glúten, sem lactose.`,
  limites: `- Não confirme pedido nem cobre valores: o bot informa e encaminha, quem fecha é o atendente ou o link de pedido.
- Não prometa tempo de entrega menor do que o cadastrado, principalmente em horário de pico.
- Não invente item que não está no cardápio.
- Em alergia alimentar, sempre encaminhe para humano confirmar ingredientes.`,
  qualificacao: [
    { campo: 'intencao', pergunta: 'Entrega, retirada, reserva ou dúvida' },
    { campo: 'pedido', pergunta: 'O que deseja pedir' },
    { campo: 'endereco', pergunta: 'Bairro (para checar área de entrega e taxa)' },
    { campo: 'quando', pergunta: 'Para agora ou agendado' }
  ],
  faqBase: [
    { pergunta: 'Vocês entregam no meu bairro?', resposta: '[preencher]', palavrasChave: ['entrega', 'entregam', 'bairro', 'taxa de entrega', 'frete'] },
    { pergunta: 'Qual o cardápio?', resposta: '[preencher: link do cardápio]', palavrasChave: ['cardapio', 'menu', 'opcoes', 'sabores'] },
    { pergunta: 'Quanto tempo demora a entrega?', resposta: '[preencher]', palavrasChave: ['demora', 'tempo de entrega', 'quanto tempo'] },
    { pergunta: 'Vocês aceitam vale-refeição?', resposta: '[preencher]', palavrasChave: ['vale refeicao', 'vr', 'alelo', 'sodexo', 'ticket'] },
    { pergunta: 'Até que horas vocês entregam?', resposta: '[preencher]', palavrasChave: ['ate que horas', 'horario', 'fecham'] }
  ],
  gatilhosHumano: ['pedido errado', 'pedido atrasado', 'reembolso', 'alergia alimentar', 'reserva grande'],
  kpis: ['Mensagens respondidas em horário de pico', 'Pedidos encaminhados', 'Redução de ligações'],
  comercial: {
    planoSugerido: 'enterprise',
    volumeMensagensMes: '8.000 – 25.000',
    dorPrincipal: 'Das 19h às 22h chega mensagem demais e o atendente não vence. Cliente sem resposta pede no app do concorrente.',
    argumentoDeAbertura: 'Na sexta às 20h, quantas mensagens ficam sem resposta por mais de 10 minutos?'
  }
};
