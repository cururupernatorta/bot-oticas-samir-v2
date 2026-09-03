module.exports = {
  id: 'petshop',
  nome: 'Pet shops, banho e tosa e clínicas veterinárias',
  emoji: '🐶',
  categoria: 'servicos-recorrentes',
  nomeBotSugerido: 'Mel',
  vocabulario: { cliente: 'tutor', unidade: 'unidade', unidades: 'unidades', profissional: 'atendente' },
  objetivo: 'Identificar o serviço (banho, tosa, consulta, vacina, produtos), coletar dados do pet e encaminhar para agendamento.',
  descricaoTemplate: 'Pet shop com banho e tosa, produtos e atendimento veterinário em [N] unidade(s).',
  conhecimentoTemplate: `SERVIÇOS: banho, tosa (tipos), hidratação, taxi dog, hospedagem, adestramento.
VETERINÁRIO: consulta, vacinas disponíveis, exames, castração, horário do vet.
TABELA POR PORTE: como o preço varia (pequeno/médio/grande, pelo curto/longo).
PRODUTOS: rações trabalhadas, medicamentos, acessórios.
LEVA E TRAZ: cobre quais bairros e qual a taxa.
EXIGÊNCIAS: carteira de vacinação em dia? antipulgas?`,
  limites: `- PROIBIDO dar diagnóstico veterinário, indicar medicamento ou dose.
- Em relato de emergência (não come, convulsão, atropelamento, sangramento, dificuldade de respirar), acione humano IMEDIATAMENTE e oriente procurar atendimento.
- Preço de banho/tosa só se a tabela por porte estiver cadastrada; caso contrário confirme na unidade.
- Não prometa horário de agenda sem confirmação humana.`,
  qualificacao: [
    { campo: 'servico', pergunta: 'Qual serviço quer (banho, tosa, consulta, vacina, produto)' },
    { campo: 'pet', pergunta: 'Nome, espécie, raça e porte do pet' },
    { campo: 'primeira_vez', pergunta: 'Primeira vez na casa ou já é cliente' },
    { campo: 'disponibilidade', pergunta: 'Dia e turno preferidos' },
    { campo: 'unidade', pergunta: 'Qual unidade / precisa de leva e traz' }
  ],
  faqBase: [
    { pergunta: 'Quanto custa o banho?', resposta: '[preencher: varia por porte]', palavrasChave: ['banho', 'quanto custa banho', 'preco banho'] },
    { pergunta: 'Vocês fazem leva e traz?', resposta: '[preencher]', palavrasChave: ['leva e traz', 'taxi dog', 'busca', 'buscam'] },
    { pergunta: 'Vocês têm veterinário?', resposta: '[preencher]', palavrasChave: ['veterinario', 'consulta', 'vacina'] },
    { pergunta: 'Precisa agendar?', resposta: '[preencher]', palavrasChave: ['agendar', 'agendamento', 'marcar', 'horario'] }
  ],
  gatilhosHumano: ['emergência com o pet', 'reclamação de tosa', 'pet machucado', 'cancelamento'],
  kpis: ['Agendamentos de banho/tosa por semana', 'Recompra (tutor que volta em 30 dias)', 'Mensagens fora do horário'],
  comercial: {
    planoSugerido: 'essencial',
    volumeMensagensMes: '1.800 – 4.500',
    dorPrincipal: 'Agenda de banho e tosa gerenciada no WhatsApp com a atendente molhada e de luva. Metade das mensagens fica sem resposta no sábado.',
    argumentoDeAbertura: 'Sábado é o dia que mais entra mensagem e o dia que vocês menos conseguem responder. Concorda?'
  }
};
