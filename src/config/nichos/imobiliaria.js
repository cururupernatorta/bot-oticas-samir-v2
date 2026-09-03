module.exports = {
  id: 'imobiliaria',
  nome: 'Imobiliárias e corretores',
  emoji: '🏠',
  categoria: 'alto-ticket',
  nomeBotSugerido: 'Júlia',
  vocabulario: { cliente: 'cliente', unidade: 'equipe', unidades: 'equipes', profissional: 'corretor(a)' },
  objetivo: 'Qualificar o perfil de busca (compra/aluguel, região, faixa de valor, financiamento) e entregar o lead pronto ao corretor certo.',
  descricaoTemplate: 'Imobiliária atuando em [cidade/região] com venda, locação e administração de imóveis.',
  conhecimentoTemplate: `ATUAÇÃO: compra, venda, locação, lançamentos, comercial, rural.
REGIÕES/BAIRROS ATENDIDOS:
TIPOS DE IMÓVEL: apartamento, casa, terreno, sala, galpão.
DOCUMENTOS PARA LOCAÇÃO: fiador, seguro-fiança, caução — qual a política.
TAXAS: taxa de administração, primeira locação, comissão (o que pode ser dito).
FINANCIAMENTO: trabalham com quais bancos, fazem simulação?
COMO FUNCIONA A VISITA: agendamento, horários, acompanhamento.`,
  limites: `- Não prometa aprovação de financiamento, valor de avaliação nem negocie valor de aluguel/venda.
- Não afirme disponibilidade de um imóvel específico sem confirmação: o estoque muda todo dia.
- Não dê orientação jurídica sobre contrato.
- Não colete CPF, renda ou documentos pelo WhatsApp — isso é etapa do corretor.`,
  qualificacao: [
    { campo: 'operacao', pergunta: 'Comprar, alugar ou vender/anunciar' },
    { campo: 'perfil', pergunta: 'Tipo de imóvel, nº de quartos, vaga, região desejada' },
    { campo: 'orcamento', pergunta: 'Faixa de valor pretendida' },
    { campo: 'pagamento', pergunta: 'À vista, financiado (já tem aprovação?) ou FGTS' },
    { campo: 'prazo', pergunta: 'Para quando precisa mudar/decidir' }
  ],
  faqBase: [
    { pergunta: 'Vocês trabalham com financiamento?', resposta: '[preencher]', palavrasChave: ['financiamento', 'financiar', 'caixa', 'banco', 'fgts'] },
    { pergunta: 'Precisa de fiador para alugar?', resposta: '[preencher]', palavrasChave: ['fiador', 'seguro fianca', 'caucao', 'garantia'] },
    { pergunta: 'Como faço para agendar uma visita?', resposta: '[preencher]', palavrasChave: ['visita', 'visitar', 'conhecer o imovel', 'agendar'] },
    { pergunta: 'Vocês aceitam imóvel para anunciar?', resposta: '[preencher]', palavrasChave: ['anunciar', 'colocar a venda', 'captacao', 'quero vender'] }
  ],
  gatilhosHumano: ['proposta', 'negociação de valor', 'reclamação de contrato', 'vistoria', 'inadimplência'],
  kpis: ['Leads qualificados por corretor', 'Visitas agendadas/mês', 'Tempo de primeira resposta'],
  comercial: {
    planoSugerido: 'enterprise',
    volumeMensagensMes: '6.000 – 20.000',
    dorPrincipal: 'Leads de portal e anúncio chegam 24h e são distribuídos na sorte. Corretor bom perde tempo com curioso; lead quente esfria.',
    argumentoDeAbertura: 'Quanto custa o seu lead de portal? E quantos deles o corretor responde em menos de 5 minutos?'
  }
};
