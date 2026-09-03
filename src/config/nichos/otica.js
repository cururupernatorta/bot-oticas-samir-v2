module.exports = {
  id: 'otica',
  nome: 'Óticas e centros óticos',
  emoji: '👓',
  categoria: 'varejo-especializado',
  nomeBotSugerido: 'Ana',
  vocabulario: { cliente: 'cliente', unidade: 'filial', unidades: 'filiais', profissional: 'consultor(a)' },
  objetivo: 'Entender a necessidade ótica (grau, lentes, armação, exame), orientar sobre a filial mais conveniente e entregar o lead pronto ao consultor.',
  descricaoTemplate: 'Rede de óticas com atendimento em [N] filiais. Vende armações, lentes de grau, lentes de contato, óculos solar e realiza exame de vista.',
  conhecimentoTemplate: `SERVIÇOS: exame de vista (gratuito?), montagem, ajustes, conserto, garantia.
LENTES: tipos trabalhados (monofocal, multifocal, antirreflexo, transitions, blue light) e o que difere cada uma.
MARCAS DE ARMAÇÃO: (liste as principais)
LENTES DE CONTATO: marcas, descarte diário/mensal, exige receita?
CONVÊNIOS/PARCERIAS: (empresas, sindicatos, planos)
PRAZO DE ENTREGA: quantos dias úteis para óculos de grau.
GARANTIA: prazo e o que cobre.
PROMOÇÕES VIGENTES: (com validade)`,
  limites: `- NUNCA dê diagnóstico, indique grau ou interprete receita. Isso é do optometrista/oftalmologista.
- Não afirme se uma lente "resolve" um problema de visão.
- Não invente preço de lente: o valor depende do grau e do tipo, sempre confirme na filial.
- Não negocie desconto.`,
  qualificacao: [
    { campo: 'necessidade', pergunta: 'Óculos de grau, solar, lente de contato, exame ou conserto' },
    { campo: 'receita', pergunta: 'Já tem receita/grau atualizado ou precisa de exame' },
    { campo: 'preferencia', pergunta: 'Preferência de armação, marca ou faixa de investimento' },
    { campo: 'urgencia', pergunta: 'Para quando precisa (viagem, trabalho, quebrou o atual)' },
    { campo: 'unidade', pergunta: 'Qual filial é mais conveniente' }
  ],
  faqBase: [
    { pergunta: 'Vocês fazem exame de vista?', resposta: '[preencher: gratuito? precisa agendar?]', palavrasChave: ['exame', 'consulta', 'medir o grau', 'optometrista'] },
    { pergunta: 'Quanto tempo demora para ficar pronto o óculos?', resposta: '[preencher]', palavrasChave: ['prazo', 'demora', 'fica pronto', 'quantos dias'] },
    { pergunta: 'Vocês aceitam convênio?', resposta: '[preencher]', palavrasChave: ['convenio', 'plano', 'unimed', 'desconto empresa'] },
    { pergunta: 'Vocês trabalham com lente de contato?', resposta: '[preencher]', palavrasChave: ['lente de contato', 'lentes de contato'] },
    { pergunta: 'Vocês consertam óculos?', resposta: '[preencher]', palavrasChave: ['conserto', 'quebrou', 'arrumar', 'ajuste', 'solda'] }
  ],
  gatilhosHumano: ['reclamação de óculos entregue', 'garantia', 'grau errado', 'devolução'],
  kpis: ['Agendamentos de exame/mês', 'Leads por filial', 'Mensagens fora do horário respondidas'],
  comercial: {
    planoSugerido: 'pro',
    volumeMensagensMes: '4.000 – 9.000',
    dorPrincipal: 'Muita pergunta repetida (exame, prazo, convênio) ocupando o vendedor que deveria estar vendendo no balcão.',
    argumentoDeAbertura: 'Quantas pessoas perguntam por dia se o exame é gratuito? Isso pode ser respondido em 2 segundos, 24h por dia, sem ocupar vendedor.'
  }
};
