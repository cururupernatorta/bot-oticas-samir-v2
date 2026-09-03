module.exports = {
  id: 'materiais-construcao',
  nome: 'Materiais de construção, elétrica e hidráulica',
  emoji: '🧱',
  categoria: 'b2b-b2c',
  nomeBotSugerido: 'Rafa',
  vocabulario: { cliente: 'cliente', unidade: 'loja', unidades: 'lojas', profissional: 'vendedor' },
  objetivo: 'Entender o que o cliente precisa comprar, o volume e o prazo, e encaminhar para o vendedor montar o orçamento.',
  descricaoTemplate: 'Loja de materiais de construção com [N] unidade(s). Atende obra, reforma, profissional e consumidor final.',
  conhecimentoTemplate: `LINHAS DE PRODUTO: (básico de obra, acabamento, elétrica, hidráulica, tintas, ferramentas...)
MARCAS TRABALHADAS:
ENTREGA: raio de entrega, prazo, frete grátis a partir de qual valor.
ORÇAMENTO: como pedir (lista, foto do projeto, planta).
CONDIÇÕES PARA PROFISSIONAL/PEDREIRO: desconto, cadastro, programa de fidelidade.
PAGAMENTO: prazo para pessoa jurídica, boleto, cartão.
RETIRADA: prazo de separação.`,
  limites: `- Não informe preço ou estoque sem confirmação: o vendedor confirma no sistema.
- Não faça cálculo de material de obra (quantidade de sacos, m² de piso) — isso é responsabilidade técnica.
- Não prometa prazo de entrega.
- Não negocie desconto de profissional.`,
  qualificacao: [
    { campo: 'material', pergunta: 'Quais materiais/itens precisa' },
    { campo: 'volume', pergunta: 'Quantidade ou tamanho da obra' },
    { campo: 'perfil', pergunta: 'É consumidor final, pedreiro/profissional ou empresa' },
    { campo: 'prazo', pergunta: 'Para quando precisa e se precisa de entrega' },
    { campo: 'unidade', pergunta: 'Qual loja' }
  ],
  faqBase: [
    { pergunta: 'Vocês fazem entrega?', resposta: '[preencher]', palavrasChave: ['entrega', 'entregam', 'frete', 'levam'] },
    { pergunta: 'Vocês vendem para pedreiro com desconto?', resposta: '[preencher]', palavrasChave: ['pedreiro', 'profissional', 'desconto', 'cadastro'] },
    { pergunta: 'Vocês parcelam ou vendem a prazo?', resposta: '[preencher]', palavrasChave: ['prazo', 'parcela', 'boleto', 'faturado', 'crediario'] },
    { pergunta: 'Como peço um orçamento?', resposta: '[preencher]', palavrasChave: ['orcamento', 'cotacao', 'lista de material'] }
  ],
  gatilhosHumano: ['orçamento fechado', 'pedido com entrega errada', 'troca/devolução', 'compra grande'],
  kpis: ['Orçamentos encaminhados/mês', 'Ticket médio dos leads do bot', 'Mensagens fora do horário'],
  comercial: {
    planoSugerido: 'pro',
    volumeMensagensMes: '3.000 – 9.000',
    dorPrincipal: 'Pedido de orçamento chega de madrugada e no domingo (dia de obra). Segunda-feira o cliente já comprou.',
    argumentoDeAbertura: 'Pedreiro manda lista de material no domingo à noite. Vocês respondem quando?'
  }
};
