module.exports = {
  id: 'odontologia',
  nome: 'Clínicas odontológicas e consultórios',
  emoji: '🦷',
  categoria: 'saude',
  nomeBotSugerido: 'Bia',
  vocabulario: { cliente: 'paciente', unidade: 'unidade', unidades: 'unidades', profissional: 'recepção' },
  objetivo: 'Entender a queixa/procedimento de interesse, informar o que é atendido e encaminhar para agendamento com a recepção.',
  descricaoTemplate: 'Clínica odontológica com [N] unidade(s). Atende clínica geral, estética, ortodontia, implantes e urgências.',
  conhecimentoTemplate: `ESPECIALIDADES: (clínica geral, ortodontia, implante, endodontia, estética, odontopediatria...)
PROFISSIONAIS: nomes, especialidades e dias de atendimento.
CONVÊNIOS ACEITOS: (lista) — e o que é apenas particular.
PRIMEIRA CONSULTA/AVALIAÇÃO: é gratuita? quanto tempo dura?
FORMAS DE PAGAMENTO: parcelamento, entrada, boleto.
URGÊNCIA: como funciona atendimento de dor fora do horário.
DOCUMENTOS: o que o paciente deve levar.`,
  limites: `- PROIBIDO dar diagnóstico, sugerir tratamento, indicar medicamento ou estimar duração clínica.
- Não prometa resultado estético nem afirme que "vai resolver".
- Não passe preço fechado de tratamento: depende de avaliação. Informe apenas faixa quando autorizado.
- Em relato de dor forte, sangramento, trauma ou inchaço, acione atendimento humano imediatamente.
- Nunca peça foto de dentro da boca nem dados de saúde detalhados pelo WhatsApp.`,
  qualificacao: [
    { campo: 'motivo', pergunta: 'Qual o motivo do contato (dor, avaliação, estética, ortodontia, revisão)' },
    { campo: 'primeira_vez', pergunta: 'Já é paciente da clínica ou primeira vez' },
    { campo: 'convenio', pergunta: 'Tem convênio ou será particular' },
    { campo: 'disponibilidade', pergunta: 'Melhor turno e dias para agendar' },
    { campo: 'unidade', pergunta: 'Qual unidade prefere' }
  ],
  faqBase: [
    { pergunta: 'Vocês atendem convênio?', resposta: '[preencher]', palavrasChave: ['convenio', 'plano odontologico', 'amil', 'odontoprev', 'unimed'] },
    { pergunta: 'A avaliação é gratuita?', resposta: '[preencher]', palavrasChave: ['avaliacao', 'primeira consulta', 'gratuita', 'orcamento'] },
    { pergunta: 'Vocês atendem urgência / dor de dente?', resposta: '[preencher]', palavrasChave: ['urgencia', 'dor de dente', 'emergencia', 'encaixe'] },
    { pergunta: 'Vocês parcelam o tratamento?', resposta: '[preencher]', palavrasChave: ['parcela', 'parcelar', 'pagamento', 'cartao'] },
    { pergunta: 'Vocês colocam aparelho?', resposta: '[preencher]', palavrasChave: ['aparelho', 'ortodontia', 'alinhador', 'invisalign'] }
  ],
  gatilhosHumano: ['dor forte', 'sangramento', 'trauma', 'inchaço', 'reclamação de tratamento', 'cancelamento de consulta'],
  kpis: ['Agendamentos gerados/mês', 'Taxa de no-show (com lembrete)', 'Mensagens fora do horário respondidas'],
  comercial: {
    planoSugerido: 'pro',
    volumeMensagensMes: '3.500 – 10.000',
    dorPrincipal: 'A recepção não consegue atender telefone, WhatsApp e paciente na cadeira ao mesmo tempo. Mensagem parada = agenda com buraco.',
    argumentoDeAbertura: 'Quantas mensagens chegam depois das 18h? Cada agenda vazia amanhã provavelmente é uma dessas mensagens que ninguém respondeu.'
  }
};
