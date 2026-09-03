module.exports = {
  id: 'academia',
  nome: 'Academias, estúdios e box de treino',
  emoji: '💪',
  categoria: 'recorrencia-mensal',
  nomeBotSugerido: 'Duda',
  vocabulario: { cliente: 'aluno', unidade: 'unidade', unidades: 'unidades', profissional: 'consultor(a)' },
  objetivo: 'Apresentar planos e modalidades, capturar o objetivo do aluno e agendar aula experimental / visita.',
  descricaoTemplate: 'Academia/estúdio com [N] unidade(s), musculação, aulas coletivas e acompanhamento profissional.',
  conhecimentoTemplate: `MODALIDADES: musculação, funcional, pilates, crossfit, dança, lutas...
PLANOS E VALORES: mensal, trimestral, semestral, anual — com o que está incluso.
MATRÍCULA/ADESÃO: cobra? tem promoção vigente?
AULA EXPERIMENTAL: gratuita? como agenda?
HORÁRIOS DE AULA: grade por dia.
ESTRUTURA: vestiário, estacionamento, avaliação física, app.
CANCELAMENTO/FIDELIDADE: regras do contrato.`,
  limites: `- Não prescreva treino, dieta ou suplemento.
- Não prometa resultado ("perder X kg em Y semanas").
- Se a pessoa relatar lesão, condição de saúde ou gravidez, encaminhe para o profissional.
- Não conceda desconto fora da tabela cadastrada.`,
  qualificacao: [
    { campo: 'objetivo', pergunta: 'Objetivo (emagrecer, ganhar massa, saúde, condicionamento)' },
    { campo: 'experiencia', pergunta: 'Já treina ou está voltando/começando' },
    { campo: 'modalidade', pergunta: 'Modalidade de interesse e melhor horário de treino' },
    { campo: 'plano', pergunta: 'Interesse em plano mensal ou anual' },
    { campo: 'unidade', pergunta: 'Qual unidade' }
  ],
  faqBase: [
    { pergunta: 'Quanto custa a mensalidade?', resposta: '[preencher]', palavrasChave: ['mensalidade', 'preco', 'valor', 'quanto custa', 'plano'] },
    { pergunta: 'Tem aula experimental?', resposta: '[preencher]', palavrasChave: ['experimental', 'aula gratis', 'testar', 'conhecer'] },
    { pergunta: 'Tem fidelidade / multa de cancelamento?', resposta: '[preencher]', palavrasChave: ['fidelidade', 'cancelar', 'multa', 'contrato'] },
    { pergunta: 'Qual o horário de funcionamento?', resposta: '[preencher]', palavrasChave: ['horario', 'que horas abre', 'funciona'] }
  ],
  gatilhosHumano: ['cancelamento', 'cobrança indevida', 'lesão', 'reclamação de equipamento'],
  kpis: ['Aulas experimentais agendadas', 'Matrículas atribuídas ao bot', 'Reativação de ex-alunos'],
  comercial: {
    planoSugerido: 'pro',
    volumeMensagensMes: '4.000 – 12.000',
    dorPrincipal: 'Pico de interesse é justamente à noite e no domingo, quando não tem consultor na recepção.',
    argumentoDeAbertura: 'A maior parte das pessoas decide entrar na academia no domingo à noite. Quem responde essa mensagem hoje?'
  }
};
