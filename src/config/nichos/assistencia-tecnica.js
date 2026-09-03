module.exports = {
  id: 'assistencia-tecnica',
  nome: 'Assistência técnica (celular, informática, eletrodomésticos)',
  emoji: '🛠️',
  categoria: 'servico-tecnico',
  nomeBotSugerido: 'Téo',
  vocabulario: { cliente: 'cliente', unidade: 'loja', unidades: 'lojas', profissional: 'técnico' },
  objetivo: 'Identificar aparelho e defeito, informar se a assistência atende aquele modelo e encaminhar para orçamento.',
  descricaoTemplate: 'Assistência técnica com [N] loja(s). Conserto de aparelhos, troca de peças, venda de acessórios.',
  conhecimentoTemplate: `APARELHOS ATENDIDOS: (marcas e modelos; o que NÃO atende)
SERVIÇOS: troca de tela, bateria, conector, placa, formatação, recuperação de dados.
ORÇAMENTO: gratuito? cobra taxa se não aprovar?
PRAZO MÉDIO POR SERVIÇO:
GARANTIA: prazo do serviço e da peça.
PEÇAS: originais/nacionais — diferença de preço e garantia.
AUTORIZADA? é assistência autorizada de alguma marca?`,
  limites: `- Não dê preço fechado sem ver o aparelho: informe apenas faixa quando cadastrada.
- Não garanta que "vai ter conserto" nem que os dados serão recuperados.
- Não oriente o cliente a abrir/consertar o aparelho por conta própria.
- Não prometa prazo de peça sob encomenda.`,
  qualificacao: [
    { campo: 'aparelho', pergunta: 'Marca e modelo do aparelho' },
    { campo: 'defeito', pergunta: 'O que aconteceu / qual o defeito' },
    { campo: 'historico', pergunta: 'Já foi consertado antes, molhou, caiu' },
    { campo: 'urgencia', pergunta: 'Precisa com urgência' },
    { campo: 'unidade', pergunta: 'Qual loja' }
  ],
  faqBase: [
    { pergunta: 'Quanto custa trocar a tela?', resposta: '[preencher: depende do modelo]', palavrasChave: ['tela', 'display', 'trocar tela', 'quanto custa'] },
    { pergunta: 'O orçamento é gratuito?', resposta: '[preencher]', palavrasChave: ['orcamento', 'avaliacao', 'gratuito', 'cobra para olhar'] },
    { pergunta: 'Quanto tempo demora o conserto?', resposta: '[preencher]', palavrasChave: ['demora', 'prazo', 'quanto tempo', 'fica pronto'] },
    { pergunta: 'Qual a garantia?', resposta: '[preencher]', palavrasChave: ['garantia', 'garante'] }
  ],
  gatilhosHumano: ['aparelho não voltou', 'reclamação de conserto', 'garantia', 'perda de dados'],
  kpis: ['Aparelhos recebidos via bot', 'Orçamentos aprovados', 'Mensagens fora do horário'],
  comercial: {
    planoSugerido: 'essencial',
    volumeMensagensMes: '1.500 – 3.500',
    dorPrincipal: '80% das mensagens são "quanto custa trocar a tela do X" — sempre a mesma resposta, sempre ocupando o técnico.',
    argumentoDeAbertura: 'Quantas vezes por dia você responde "quanto custa a tela"? Isso pode ser automático e ainda assim virar orçamento.'
  }
};
