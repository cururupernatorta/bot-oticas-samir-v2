module.exports = {
  id: 'salao-barbearia',
  nome: 'Salões de beleza e barbearias',
  emoji: '💈',
  categoria: 'agenda-cheia',
  nomeBotSugerido: 'Nina',
  vocabulario: { cliente: 'cliente', unidade: 'unidade', unidades: 'unidades', profissional: 'profissional' },
  objetivo: 'Informar serviços e valores, entender o que a pessoa quer fazer e encaminhar para o encaixe na agenda.',
  descricaoTemplate: 'Salão/barbearia com [N] unidade(s) e equipe de profissionais especializados.',
  conhecimentoTemplate: `SERVIÇOS E VALORES: (corte, coloração, mechas, progressiva, manicure, barba, sobrancelha...)
DURAÇÃO MÉDIA DE CADA SERVIÇO:
PROFISSIONAIS: nome, especialidade e dias que atendem.
POLÍTICA DE AGENDAMENTO: precisa sinal? tolerância de atraso? taxa de no-show?
PRODUTOS UTILIZADOS: marcas.
PROMOÇÕES: dias de menor movimento com preço promocional.`,
  limites: `- Não prometa horário na agenda sem confirmação da recepção.
- Não estime resultado de coloração/química sem avaliação presencial (histórico do cabelo importa).
- Preço só o da tabela cadastrada; serviços químicos costumam variar por comprimento.
- Não negocie desconto.`,
  qualificacao: [
    { campo: 'servico', pergunta: 'Qual serviço deseja' },
    { campo: 'profissional', pergunta: 'Tem preferência de profissional' },
    { campo: 'disponibilidade', pergunta: 'Melhor dia e turno' },
    { campo: 'historico', pergunta: 'Para química: o que já fez no cabelo recentemente' },
    { campo: 'unidade', pergunta: 'Qual unidade' }
  ],
  faqBase: [
    { pergunta: 'Quanto custa o corte?', resposta: '[preencher]', palavrasChave: ['corte', 'preco', 'valor', 'quanto custa'] },
    { pergunta: 'Precisa agendar ou é por ordem de chegada?', resposta: '[preencher]', palavrasChave: ['agendar', 'ordem de chegada', 'fila', 'marcar'] },
    { pergunta: 'Vocês fazem progressiva?', resposta: '[preencher]', palavrasChave: ['progressiva', 'quimica', 'alisamento', 'botox'] },
    { pergunta: 'Qual o horário de funcionamento?', resposta: '[preencher]', palavrasChave: ['horario', 'que horas', 'domingo', 'funciona'] }
  ],
  gatilhosHumano: ['insatisfação com serviço', 'remarcação em cima da hora', 'reembolso'],
  kpis: ['Agendamentos/semana', 'Redução de no-show', 'Preenchimento de horários ociosos'],
  comercial: {
    planoSugerido: 'essencial',
    volumeMensagensMes: '1.500 – 3.500',
    dorPrincipal: 'O profissional está com a mão na cabeça do cliente e o WhatsApp tocando. Ou perde o agendamento, ou perde a qualidade do atendimento.',
    argumentoDeAbertura: 'Você atende o WhatsApp enquanto está cortando? Quantos agendamentos acha que perde por semana por não conseguir responder?'
  }
};
