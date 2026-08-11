function formatarTelefone(phone) {
  return phone.replace(/^55/, '').replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

function horarioBrasil() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function hojeBrasil() {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function filialEstaAberta(loja) {
  const agora = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const d = new Date(agora);
  const dia = d.getDay();
  const hd = d.getHours() + d.getMinutes() / 60;
  const nome = (loja.nome || '').toLowerCase();

  if (nome.includes('shopping jl') || nome.includes('jl')) {
    if (dia >= 1 && dia <= 6) return hd >= 10.0 && hd < 22.0;
    if (dia === 0) return hd >= 14.0 && hd < 20.0;
    return false;
  }
  if (nome.includes('toledo')) {
    if (dia >= 1 && dia <= 5) return hd >= 9.0 && hd < 18.5;
    if (dia === 6) return hd >= 9.0 && hd < 13.0;
    return false;
  }
  if (dia >= 1 && dia <= 5) return hd >= 8.5 && hd < 18.5;
  if (dia === 6) return hd >= 8.5 && hd < 13.0;
  return false;
}

function horarioFilial(loja) {
  const nome = (loja.nome || '').toLowerCase();
  if (nome.includes('shopping jl') || nome.includes('jl'))
    return 'Seg-Sáb 10h-22h | Dom 14h-20h';
  if (nome.includes('toledo'))
    return 'Seg-Sex 09h-18h30 | Sáb 09h-13h | Dom fechado';
  return 'Seg-Sex 08h30-18h30 | Sáb 08h30-13h | Dom fechado';
}

function filiaisAbertas(lojas) {
  const abertas = [];
  for (const key of Object.keys(lojas || {})) {
    if (filialEstaAberta(lojas[key])) abertas.push({ key, ...lojas[key] });
  }
  return abertas;
}

function filialAleatoria(lojas) {
  const keys = Object.keys(lojas || {});
  if (keys.length === 0) return null;
  const k = keys[Math.floor(Math.random() * keys.length)];
  return { key: k, ...lojas[k] };
}

function filtrarMensagemSimples(message, nomeBot = 'Ana', nomeEmpresa = 'a empresa') {
  const norm = message.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const simples = ['ok','okay','oki','sim','nao','oi','ola','e ai','obrigado','obrigada','obg','vlw','valeu','certo','entendi','combinado','beleza','blz','ta','ta bom','perfeito','show','tchau','ate logo','falou','flw','bom dia','boa tarde','boa noite','👍','👏','🙏','😊','❤️','✅','🙂'];
  const soEmoji = /^[\p{Emoji}\s]+$/u.test(message) && message.trim().length <= 5;
  const isSimple = simples.includes(norm) || soEmoji;

  const respostas = {
    'bom dia': `Bom dia! 😊 Sou a ${nomeBot}, da ${nomeEmpresa}. Como posso ajudar?`,
    'boa tarde': `Boa tarde! 😊 Sou a ${nomeBot}, da ${nomeEmpresa}. Como posso ajudar?`,
    'boa noite': `Boa noite! 😊 Sou a ${nomeBot}, da ${nomeEmpresa}. Como posso ajudar?`,
    'oi': `Olá! Sou a ${nomeBot}, da ${nomeEmpresa}. Como posso te ajudar hoje? 😊`,
    'ola': `Olá! Sou a ${nomeBot}, da ${nomeEmpresa}. Como posso te ajudar hoje? 😊`,
    'obrigado': 'Disponha! Qualquer coisa é só chamar 😊',
    'obrigada': 'Disponha! Qualquer coisa é só chamar 😊',
    'obg': 'Disponha! 😊',
    'vlw': 'Disponha! 😊',
    'valeu': 'Disponha! 😊',
    'tchau': 'Até mais! Estamos por aqui se precisar 😊',
    'falou': 'Até mais! 😊',
    'flw': 'Até mais! 😊',
  };
  return { isSimple, fixedReply: respostas[norm] || 'Estou aqui! Como posso ajudar? 😊' };
}

function tratarTipoMensagem(tipo) {
  if (tipo === 'audio') return { isSimple: true, fixedReply: 'Recebi seu áudio! Pode me contar em texto o que você precisa? 😊' };
  if (tipo === 'imagem') return { isSimple: true, fixedReply: 'Recebi sua imagem! Pode me contar em texto o que você precisa? 😊' };
  if (tipo === 'figurinha') return { isSimple: true, fixedReply: null };
  return null;
}

function trialExpirado(cliente) {
  if (!cliente.trialAte) return false;
  return new Date() > new Date(cliente.trialAte);
}

function formatarRelatorioCliente(stats, cliente) {
  const msgs = stats.reduce((a, s) => a + (s.mensagensEnviadas || 0), 0);
  const leads = stats.reduce((a, s) => a + (s.leadsGerados || 0), 0);
  const humanos = stats.reduce((a, s) => a + (s.pedidosHumano || 0), 0);
  return `📊 *Resumo da semana — ${cliente.nomeEmpresa}*

💬 Mensagens atendidas: ${msgs}
🆕 Leads enviados: ${leads}
🙋 Pedidos de humano: ${humanos}
⏱️ Bot ativo 24h — nenhuma mensagem perdida!

Continue assim! 🚀`;
}

function formatarRelatorioAdmin(linhasPorCliente, totalGeral) {
  let corpo = linhasPorCliente.join('\n\n');
  return `📊 *Relatório Semanal — Todos os Clientes*

${corpo}

━━━━━━━━━━━━━━
💰 *Custo total de IA na semana:* R$ ${totalGeral.toFixed(2)}`;
}

module.exports = {
  formatarTelefone, horarioBrasil, hojeBrasil,
  filialEstaAberta, horarioFilial, filiaisAbertas, filialAleatoria,
  filtrarMensagemSimples, tratarTipoMensagem, trialExpirado,
  formatarRelatorioCliente, formatarRelatorioAdmin
};
