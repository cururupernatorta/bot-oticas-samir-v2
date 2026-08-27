require('dotenv').config();
const readline = require('readline');
const { connectDB } = require('../src/config/database');
const { createClient } = require('../src/models/Client');
const { getPlano } = require('../src/config/planos');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

async function main() {
  await connectDB();
  console.log('═══ CADASTRO DE CLIENTE ═══\n');
  console.log('💡 Dica: preencha a "Ficha de Cadastro de Cliente" (Word) com o cliente e use os dados dela aqui.\n');

  const clientId = await ask('ID (ex: oticas-samir): ');
  const nomeEmpresa = await ask('Nome da empresa: ');
  const nomeBot = await ask('Nome do bot [Ana]: ') || 'Ana';
  const zapiInstanceId = await ask('Z-API Instance ID: ');
  const zapiToken = await ask('Z-API Token: ');
  const planoId = (await ask('Plano [start/pro/enterprise] (padrão: pro): ')) || 'pro';
  const plano = getPlano(planoId);

  const limiteInput = await ask(`Limite mensagens/mês [${plano.limiteMensagens}]: `);
  const limiteMensagens = limiteInput ? parseInt(limiteInput) : plano.limiteMensagens;

  const precoExcedenteInput = await ask(`Preço por mensagem excedente (R$) [${plano.precoPorMensagemExcedente}]: `);
  const precoPorMensagemExcedente = precoExcedenteInput ? parseFloat(precoExcedenteInput) : plano.precoPorMensagemExcedente;

  const descricao = await ask('Descrição: ');
  const conhecimento = await ask('Conhecimento (ou Enter): ');
  const limites = await ask('Limites (ou Enter): ');

  const lojas = {};
  let i = 1;
  while (true) {
    const nome = await ask(`
Filial ${i} — Nome (Enter=parar): `);
    if (!nome.trim()) break;
    const endereco = await ask('  Endereço: ');
    const horario = await ask('  Horário: ');
    const whatsapp = await ask('  WhatsApp (com DDI): ');
    lojas[i] = { nome: `${nomeEmpresa} — ${nome}`, endereco, horario, whatsapp, link: `https://wa.me/${whatsapp}` };
    i++;
  }

  await createClient({
    clientId, nomeEmpresa, nomeBot, zapiInstanceId, zapiToken,
    plano: planoId, limiteMensagens, precoPorMensagemExcedente,
    descricao, conhecimento, limites, lojas
  });

  console.log(`
✅ "${nomeEmpresa}" criado!`);
  console.log(`🔗 Webhook: https://SEU_SERVIDOR/webhook/${clientId}`);
  console.log(`📊 Plano: ${planoId} | Limite: ${limiteMensagens} msgs/mês | Excedente: R$ ${precoPorMensagemExcedente}/msg`);
  rl.close(); process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
