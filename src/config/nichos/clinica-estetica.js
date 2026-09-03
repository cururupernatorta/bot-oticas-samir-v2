module.exports = {
  id: 'clinica-estetica',
  nome: 'Clínicas de estética e dermatologia',
  emoji: '✨',
  categoria: 'saude',
  nomeBotSugerido: 'Lara',
  vocabulario: { cliente: 'cliente', unidade: 'unidade', unidades: 'unidades', profissional: 'consultora' },
  objetivo: 'Identificar o procedimento de interesse, informar como funciona a avaliação e encaminhar para agendamento.',
  descricaoTemplate: 'Clínica de estética avançada com [N] unidade(s). Procedimentos faciais, corporais, depilação a laser e harmonização.',
  conhecimentoTemplate: `PROCEDIMENTOS OFERECIDOS: (faciais, corporais, laser, injetáveis...)
COMO FUNCIONA A AVALIAÇÃO: gratuita? quanto dura? é obrigatória antes do procedimento?
PACOTES E SESSÕES: como são vendidos (avulso, pacote de N sessões).
FAIXA DE INVESTIMENTO: o que pode ser dito por WhatsApp.
CONTRAINDICAÇÕES GERAIS: (gestante, amamentação, etc. — apenas para orientar a triagem)
PROFISSIONAIS RESPONSÁVEIS: nome e registro.
PÓS-PROCEDIMENTO: cuidados gerais.`,
  limites: `- PROIBIDO indicar procedimento, prometer resultado, estimar número de sessões ou dar orientação clínica.
- Não afirme que algo "é seguro" para o caso específico da pessoa: isso depende de avaliação.
- Não peça nem comente fotos do corpo/rosto da cliente.
- Preço só como faixa, e apenas quando o cliente autorizou por escrito na configuração.
- Qualquer relato de reação, alergia ou insatisfação vai direto para humano.`,
  qualificacao: [
    { campo: 'procedimento', pergunta: 'Qual procedimento ou qual incômodo quer tratar' },
    { campo: 'historico', pergunta: 'Já fez algo parecido antes' },
    { campo: 'objetivo_prazo', pergunta: 'Tem uma data/evento em vista' },
    { campo: 'disponibilidade', pergunta: 'Melhor turno para a avaliação' },
    { campo: 'unidade', pergunta: 'Qual unidade prefere' }
  ],
  faqBase: [
    { pergunta: 'A avaliação é gratuita?', resposta: '[preencher]', palavrasChave: ['avaliacao', 'gratuita', 'primeira consulta'] },
    { pergunta: 'Quanto custa a sessão?', resposta: '[preencher: valor depende da avaliação]', palavrasChave: ['preco', 'valor', 'quanto custa', 'quanto fica'] },
    { pergunta: 'Vocês fazem depilação a laser?', resposta: '[preencher]', palavrasChave: ['laser', 'depilacao'] },
    { pergunta: 'Vocês parcelam?', resposta: '[preencher]', palavrasChave: ['parcela', 'parcelar', 'cartao', 'pagamento'] }
  ],
  gatilhosHumano: ['reação adversa', 'insatisfação com resultado', 'cancelamento de pacote', 'pergunta clínica específica'],
  kpis: ['Avaliações agendadas/mês', 'Custo por agendamento', 'Recuperação de leads antigos'],
  comercial: {
    planoSugerido: 'pro',
    volumeMensagensMes: '4.000 – 12.000',
    dorPrincipal: 'Investe pesado em anúncio, o lead chega no WhatsApp e demora 4 horas para ser respondido. O concorrente responde em 2 minutos.',
    argumentoDeAbertura: 'Você paga por cada lead que chega no WhatsApp. Quanto tempo, em média, ele espera pela primeira resposta?'
  }
};
