#!/usr/bin/env node
/**
 * CLI do agente de aquisição.
 *
 *   node scripts/agente.js ciclo         # roda um ciclo completo
 *   node scripts/agente.js prospectar    # só descoberta
 *   node scripts/agente.js qualificar    # só qualificação do que já existe
 *   node scripts/agente.js fila          # mostra o que espera aprovação
 *   node scripts/agente.js funil         # números do funil
 */
require('dotenv').config();
const { connectDB } = require('../src/config/database');
const { rodarCiclo, etapaProspeccao, etapaQualificacao } = require('../src/agente/loop');
const { filaAprovacao, contarPorStatus } = require('../src/models/Prospect');
const { AGENTE } = require('../src/agente/config');

const comandos = {
  async ciclo() {
    console.log(`\n🤖 Ciclo completo — modo ${AGENTE.modo.toUpperCase()}\n`);
    const r = await rodarCiclo();
    console.log('\n' + JSON.stringify(r, null, 2));
  },

  async prospectar() {
    console.log(`\n🔎 Prospectando em: ${AGENTE.cidades.join(', ')}\n`);
    console.log(await etapaProspeccao());
  },

  async qualificar() {
    console.log('\n🎯 Qualificando prospects descobertos\n');
    console.log(await etapaQualificacao());
  },

  async fila() {
    const fila = await filaAprovacao(50);
    if (!fila.length) return console.log('\n📭 Nada aguardando aprovação.\n');

    console.log(`\n📬 ${fila.length} mensagem(ns) aguardando aprovação:\n`);
    for (const p of fila) {
      console.log('─'.repeat(64));
      console.log(`${p.nome} — ${p.cidade} | score ${p.score} | etapa ${p.etapaPendente}`);
      console.log(`tel: ${p.telefone}`);
      if (p.gancho) console.log(`gancho: ${p.gancho}`);
      console.log('');
      console.log(p.mensagemPendente);
      console.log('');
      console.log(`aprovar:  curl -X POST "$URL/api/agente/aprovar/${p.chaveUnica}?password=$SENHA"`);
    }
    console.log('─'.repeat(64) + '\n');
  },

  async funil() {
    const f = await contarPorStatus();
    const ordem = ['descoberto', 'qualificado', 'descartado', 'abordado',
                   'respondeu', 'convertido', 'esgotado', 'rejeitado', 'descadastrado'];
    console.log('\n📊 Funil de aquisição\n');
    for (const s of ordem) {
      if (f[s]) console.log(`  ${s.padEnd(16)} ${String(f[s]).padStart(5)}`);
    }
    const total = Object.values(f).reduce((a, b) => a + b, 0);
    console.log(`  ${'TOTAL'.padEnd(16)} ${String(total).padStart(5)}\n`);

    if (f.abordado && f.respondeu) {
      const taxa = ((f.respondeu / (f.abordado + f.respondeu)) * 100).toFixed(1);
      console.log(`  taxa de resposta: ${taxa}%\n`);
    }
  }
};

async function main() {
  const cmd = process.argv[2] || 'funil';
  if (!comandos[cmd]) {
    console.error(`Comando desconhecido: ${cmd}`);
    console.error(`Disponíveis: ${Object.keys(comandos).join(', ')}`);
    process.exit(1);
  }
  await connectDB();
  await comandos[cmd]();
  process.exit(0);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
