#!/usr/bin/env node
/**
 * DEMO AO VIVO — monta o bot de um prospect em ~60 segundos.
 *
 *   npm run demo
 *
 * Feito para rodar NA FRENTE do prospect, na reunião. Sem case para mostrar,
 * a demonstração É a prova: em vez de dizer que funciona, você mostra o bot
 * dele, com o nome da empresa dele, respondendo no WhatsApp dele.
 *
 * Pede o mínimo: nome, nicho, uma unidade e três fatos. Todo o resto vem do
 * pacote de nicho. Cria com trial de 7 dias e imprime o webhook para colar
 * na WAME/Z-API.
 *
 * Depois da reunião: `npm run demo -- --limpar` remove as demos vencidas.
 */
require('dotenv').config();
const readline = require('readline');
const { connectDB, getDB } = require('../src/config/database');
const { createClient } = require('../src/models/Client');
const { listarNichos, sugestoesDoNicho } = require('../src/config/nichos');
const { parseFaixa } = require('../src/utils/horarios');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

async function limparDemos() {
  await connectDB();
  const agora = new Date();
  const res = await getDB().collection('clients').updateMany(
    { demo: true, trialAte: { $lt: agora }, ativo: true },
    { $set: { ativo: false, atualizadoEm: agora } }
  );
  console.log(`\n🧹 ${res.modifiedCount} demo(s) vencida(s) desativada(s).`);
  console.log('   Lembre de desconectar as instâncias correspondentes na WAME para parar de pagar.\n');
  process.exit(0);
}

async function main() {
  if (process.argv.includes('--limpar')) return limparDemos();

  await connectDB();
  console.log('\n⚡ DEMO AO VIVO — o bot do prospect em 60 segundos\n');

  const nomeEmpresa = await ask('Nome da empresa: ');
  if (!nomeEmpresa.trim()) { console.log('Precisa do nome.'); process.exit(1); }

  const nichos = listarNichos();
  console.log('');
  nichos.forEach((n, i) => console.log(`  ${String(i + 1).padStart(2)}. ${n.emoji} ${n.nome}`));
  const nicho = nichos[(parseInt(await ask('\nNicho (número): '), 10) || 1) - 1] || nichos[0];
  const sug = sugestoesDoNicho(nicho.id);

  console.log(`\n→ ${nicho.emoji} ${nicho.nome} · bot "${sug.nomeBot}"`);
  console.log('  Conhecimento, FAQ e regras do setor já vêm prontos.\n');

  // Os três fatos que fazem o prospect reconhecer o próprio negócio na tela.
  console.log('Agora 3 coisas que só ele sabe (Enter pula qualquer uma):\n');
  const f1 = await ask('  1. O que vocês vendem/fazem de mais importante? ');
  const f2 = await ask('  2. Um diferencial (prazo, garantia, marca, convênio)? ');
  const f3 = await ask('  3. Uma pergunta que os clientes SEMPRE fazem? ');
  const r3 = f3.trim() ? await ask('     E a resposta dela? ') : '';

  console.log('');
  const unidade = (await ask('Nome da unidade [Loja principal]: ')) || 'Loja principal';
  const whatsapp = await ask('WhatsApp que recebe os leads (5545999999999): ');
  const semana = parseFaixa((await ask('Horário Seg-Sex [08:30-18:30]: ')) || '08:30-18:30');
  const sabado = parseFaixa((await ask('Horário Sábado [08:30-13:00]: ')) || '08:30-13:00');

  console.log('');
  const zapiInstanceId = await ask('Instance ID (WAME/Z-API): ');
  const zapiToken = await ask('Token: ');

  const extras = [
    f1.trim() && `PRODUTOS/SERVIÇOS PRINCIPAIS: ${f1.trim()}`,
    f2.trim() && `DIFERENCIAL: ${f2.trim()}`
  ].filter(Boolean).join('\n');

  const clientId = `demo-${slug(nomeEmpresa)}`;
  const doc = await createClient({
    clientId,
    nomeEmpresa: nomeEmpresa.trim(),
    nicho: nicho.id,
    zapiInstanceId, zapiToken,
    whatsappGestor: whatsapp,
    plano: nicho.planoSugerido,
    // 7 dias: prazo suficiente para o prospect testar e curto o bastante
    // para criar decisão. Depois disso o bot avisa que o teste encerrou.
    trialAte: new Date(Date.now() + 7 * 864e5),
    descricao: `${sug.descricao}\n\n${nomeEmpresa.trim()}.`,
    conhecimento: extras ? `${extras}\n\n${sug.conhecimento}` : sug.conhecimento,
    faq: f3.trim() && r3.trim()
      ? [{ pergunta: f3.trim(), resposta: r3.trim(), palavrasChave: [] }, ...sug.faq]
      : sug.faq,
    lojas: {
      1: {
        nome: unidade, whatsapp, link: `https://wa.me/${whatsapp}`,
        horarios: { seg: semana, ter: semana, qua: semana, qui: semana, sex: semana, sab: sabado, dom: [] }
      }
    }
  });
  await getDB().collection('clients').updateOne({ clientId }, { $set: { demo: true } });

  const base = process.env.BASE_URL || 'https://SEU_SERVIDOR';
  console.log('\n' + '═'.repeat(64));
  console.log(`✅ ${doc.nomeEmpresa} — pronto.`);
  console.log('═'.repeat(64));
  console.log(`\n🔗 Cole este webhook no painel da WAME (evento: mensagem recebida):`);
  console.log(`\n   ${base}/webhook/${clientId}\n`);
  console.log(`🤖 Bot: ${doc.nomeBot}   ·   📅 Teste até ${doc.trialAte.toLocaleDateString('pt-BR')}`);
  console.log(`💬 ${doc.faq.length} respostas prontas · ${doc.qualificacao.length} pontos de qualificação\n`);
  console.log('AGORA, NA REUNIÃO:');
  console.log('  1. Mande "oi" pelo WhatsApp e mostre a resposta chegando');
  console.log('  2. ENTREGUE SEU CELULAR e peça: "pergunta aí, como se fosse cliente"');
  console.log('  3. Complete uma conversa até o lead chegar no WhatsApp dele');
  console.log('  4. Abra /admin e mostre as REGRAS do nicho — o que o bot é proibido de dizer\n');
  console.log('⚠️  Respostas com [preencher] não são enviadas: o bot chama um humano em vez');
  console.log('    de responder template. Se ele fechar, preencha tudo antes do go-live.\n');

  rl.close();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
