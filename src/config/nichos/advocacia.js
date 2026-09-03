module.exports = {
  id: 'advocacia',
  nome: 'Escritórios de advocacia e contabilidade',
  emoji: '⚖️',
  categoria: 'servico-profissional',
  nomeBotSugerido: 'Helena',
  vocabulario: { cliente: 'cliente', unidade: 'escritório', unidades: 'escritórios', profissional: 'responsável' },
  objetivo: 'Fazer a triagem inicial do assunto, informar as áreas de atuação e agendar a consulta com o profissional.',
  descricaoTemplate: 'Escritório atuando em [áreas]. Atendimento presencial e online, mediante agendamento.',
  conhecimentoTemplate: `ÁREAS DE ATUAÇÃO: (trabalhista, previdenciário, família, empresarial, tributário, contábil...)
O QUE NÃO ATENDEMOS:
COMO FUNCIONA A CONSULTA: presencial/online, duração, é cobrada? valor?
DOCUMENTOS QUE O CLIENTE DEVE LEVAR: por tipo de caso.
ABERTURA DE EMPRESA / MEI (contabilidade): prazo, custo, o que precisa.
HONORÁRIOS: como funcionam (êxito, fixo, mensal) — sem valores específicos.
PRAZOS: expectativa realista sobre andamento processual.`,
  limites: `- PROIBIDO dar orientação, parecer ou opinião jurídica/contábil de qualquer tipo.
- Não avalie chance de êxito, não estime valor de causa nem prazo de processo.
- Não informe honorários: isso é definido na consulta com o profissional.
- Não colete documentos, CPF, dados processuais ou detalhes sensíveis do caso pelo WhatsApp — apenas o assunto geral.
- Respeite o Código de Ética da OAB: nada de captação agressiva, promessa de resultado ou mercantilização.`,
  qualificacao: [
    { campo: 'assunto', pergunta: 'Assunto geral (área do direito / demanda contábil)' },
    { campo: 'situacao', pergunta: 'Se já existe processo/notificação em andamento' },
    { campo: 'urgencia', pergunta: 'Existe prazo ou audiência marcada' },
    { campo: 'disponibilidade', pergunta: 'Melhor dia/turno para a consulta' },
    { campo: 'modalidade', pergunta: 'Prefere presencial ou online' }
  ],
  faqBase: [
    { pergunta: 'Vocês atendem qual área?', resposta: '[preencher]', palavrasChave: ['area', 'atuacao', 'atendem', 'trabalham com'] },
    { pergunta: 'A primeira consulta é cobrada?', resposta: '[preencher]', palavrasChave: ['consulta', 'cobrada', 'gratuita', 'primeira'] },
    { pergunta: 'Vocês atendem online?', resposta: '[preencher]', palavrasChave: ['online', 'remoto', 'presencial', 'videochamada'] },
    { pergunta: 'Vocês abrem empresa / MEI?', resposta: '[preencher]', palavrasChave: ['abrir empresa', 'mei', 'cnpj', 'abertura'] }
  ],
  gatilhosHumano: ['prazo/audiência iminente', 'assunto sensível', 'reclamação', 'qualquer pedido de orientação jurídica'],
  kpis: ['Consultas agendadas/mês', 'Triagem: leads dentro da área de atuação', 'Tempo de primeira resposta'],
  comercial: {
    planoSugerido: 'essencial',
    volumeMensagensMes: '1.500 – 4.000',
    dorPrincipal: 'Chega muita mensagem de assunto que o escritório nem atende, e o advogado gasta tempo respondendo curioso.',
    argumentoDeAbertura: 'Quanto do seu dia vai embora respondendo mensagem de caso que você nem pega?'
  }
};
