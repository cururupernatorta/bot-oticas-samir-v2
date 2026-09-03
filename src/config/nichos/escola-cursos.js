module.exports = {
  id: 'escola-cursos',
  nome: 'Escolas, cursos livres e idiomas',
  emoji: '🎓',
  categoria: 'recorrencia-mensal',
  nomeBotSugerido: 'Sofia',
  vocabulario: { cliente: 'interessado', unidade: 'unidade', unidades: 'unidades', profissional: 'consultor(a) educacional' },
  objetivo: 'Entender o perfil do aluno e o objetivo, apresentar cursos e turmas, e agendar visita/aula demonstrativa.',
  descricaoTemplate: 'Escola/curso com [N] unidade(s). Turmas presenciais e/ou online, matrículas abertas.',
  conhecimentoTemplate: `CURSOS OFERECIDOS: nome, carga horária, duração, nível.
TURMAS E HORÁRIOS: dias e turnos disponíveis por curso.
VALORES: matrícula, mensalidade, material didático, formas de pagamento.
IDADE MÍNIMA/PRÉ-REQUISITOS:
MODALIDADE: presencial, online, híbrido.
CERTIFICADO: emite? reconhecido por quem?
BOLSAS/DESCONTOS: irmão, pagamento antecipado, convênio empresa.
CALENDÁRIO: início das próximas turmas.`,
  limites: `- Não prometa vaga em turma sem confirmação da secretaria.
- Não garanta nível de proficiência, aprovação em prova ou empregabilidade.
- Não conceda desconto ou bolsa fora do que está cadastrado.
- Para menores de idade, sempre direcione a conversa ao responsável.`,
  qualificacao: [
    { campo: 'curso', pergunta: 'Qual curso interessa' },
    { campo: 'aluno', pergunta: 'Para quem é (a própria pessoa, filho, equipe) e idade' },
    { campo: 'objetivo', pergunta: 'Objetivo (trabalho, intercâmbio, escola, hobby)' },
    { campo: 'disponibilidade', pergunta: 'Turno e dias disponíveis' },
    { campo: 'unidade', pergunta: 'Qual unidade / prefere online' }
  ],
  faqBase: [
    { pergunta: 'Quanto custa a mensalidade?', resposta: '[preencher]', palavrasChave: ['mensalidade', 'valor', 'preco', 'quanto custa', 'investimento'] },
    { pergunta: 'Quando começam as próximas turmas?', resposta: '[preencher]', palavrasChave: ['turma', 'inicio', 'quando comeca', 'matricula'] },
    { pergunta: 'O curso é presencial ou online?', resposta: '[preencher]', palavrasChave: ['presencial', 'online', 'ead', 'modalidade'] },
    { pergunta: 'Emite certificado?', resposta: '[preencher]', palavrasChave: ['certificado', 'diploma', 'reconhecido'] }
  ],
  gatilhosHumano: ['negociação de bolsa', 'trancamento', 'reclamação de professor', 'cobrança'],
  kpis: ['Visitas/aulas demonstrativas agendadas', 'Matrículas atribuídas ao bot', 'Leads na janela de matrícula'],
  comercial: {
    planoSugerido: 'pro',
    volumeMensagensMes: '3.000 – 10.000',
    dorPrincipal: 'Na janela de matrícula chega 5x mais mensagem e a secretaria não dá conta. Fora da janela, ninguém faz follow-up.',
    argumentoDeAbertura: 'Na temporada de matrícula vocês contratam gente extra só para responder WhatsApp? Isso pode ser resolvido de outro jeito.'
  }
};
