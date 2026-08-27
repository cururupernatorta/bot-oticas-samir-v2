#!/usr/bin/env node
/**
 * CLI do Estúdio de Texto.
 *
 *   node scripts/texto.js analisar  texto.txt
 *   node scripts/texto.js orcar     texto.txt [servico] [urgencia] [complexidade]
 *   node scripts/texto.js revisar   texto.txt [--alvo 25] [--saida pasta/]
 *   node scripts/texto.js relatorio original.txt revisado.txt [--saida rel.html]
 *   node scripts/texto.js tabela
 *
 * analisar, orcar e relatorio rodam offline: sem Mongo, sem chave de API.
 * Só revisar precisa do CLAUDE_API_KEY.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { analisar } = require('../src/estudio/analisador');
const { orcar, recomendar } = require('../src/estudio/orcamento');
const { verificar } = require('../src/estudio/qa');
const { gerar } = require('../src/estudio/relatorio');
const { SERVICOS, URGENCIA, COMPLEXIDADE } = require('../src/estudio/config');

const C = {
  neg: s => `\x1b[1m${s}\x1b[0m`,
  fraco: s => `\x1b[2m${s}\x1b[0m`,
  verde: s => `\x1b[32m${s}\x1b[0m`,
  amar: s => `\x1b[33m${s}\x1b[0m`,
  verm: s => `\x1b[31m${s}\x1b[0m`
};

function corDoScore(n) {
  return n >= 60 ? C.verm(String(n)) : n >= 35 ? C.amar(String(n)) : C.verde(String(n));
}

function ler(arquivo) {
  if (!arquivo) throw new Error('informe o arquivo de texto');
  if (!fs.existsSync(arquivo)) throw new Error(`arquivo não encontrado: ${arquivo}`);
  const t = fs.readFileSync(arquivo, 'utf8');
  if (!t.trim()) throw new Error(`arquivo vazio: ${arquivo}`);
  return t;
}

function flag(nome, padrao) {
  const i = process.argv.indexOf('--' + nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

function barra(valor, largura = 28) {
  const cheio = Math.round((Math.min(100, valor) / 100) * largura);
  return '█'.repeat(cheio) + C.fraco('░'.repeat(largura - cheio));
}

const comandos = {
  async analisar() {
    const texto = ler(process.argv[3]);
    const r = analisar(texto);

    console.log('');
    console.log(C.neg('  ÍNDICE DE NATURALIDADE'));
    console.log('');
    console.log(`  ${barra(r.score)}  ${corDoScore(r.score)}/100`);
    console.log(`  ${C.fraco(r.veredito)} · confiança ${r.confianca}`);
    console.log('');
    console.log(C.neg('  INDÍCIOS'));
    for (const i of r.indicios) {
      console.log(`    ${i.nome.padEnd(24)} ${String(Math.round(i.suspeita)).padStart(3)}  ${C.fraco(i.leitura)}`);
      if (i.itens?.length) {
        console.log(`      ${C.fraco('→ ' + i.itens.map(x => x.termo + (x.n > 1 ? ` (${x.n}×)` : '')).join(', '))}`);
      }
    }
    console.log('');
    console.log(C.neg('  MÉTRICAS'));
    const m = r.metricas;
    console.log(`    ${m.palavras} palavras · ${m.frases} frases · ${m.paragrafos} parágrafos`);
    console.log(`    ritmo (burstiness): ${m.burstiness}   média ${m.mediaPalavrasPorFrase} palavras/frase`);
    console.log(`    riqueza vocabular:  ${m.riquezaVocabular}`);
    if (m.bigramasRepetidos.length) {
      console.log(`    repetições: ${m.bigramasRepetidos.map(b => `"${b.bigrama}" ${b.n}×`).join(', ')}`);
    }
    console.log('');
  },

  async orcar() {
    const texto = ler(process.argv[3]);
    const servico = process.argv[4];

    if (!servico) {
      const r = recomendar(texto);
      console.log('');
      console.log(C.neg('  RECOMENDAÇÃO'));
      console.log(`  Score do texto: ${corDoScore(r.analise.score)}/100 · ${r.laudas} lauda(s)`);
      console.log('');
      console.log(`  ${C.fraco(r.motivo)}`);
      console.log('');
      const o = r.orcamento;
      console.log(C.neg(`  ${o.servico} — R$ ${o.preco}`));
      console.log(`    prazo: ${o.prazoTexto}`);
      for (const l of o.memoria) console.log(`    ${C.fraco(l)}`);
      console.log(`    entrega: ${o.entrega.join(' · ')}`);
      if (r.alternativa) {
        console.log('');
        console.log(C.fraco(`  Alternativa de entrada: ${r.alternativa.servico} — R$ ${r.alternativa.preco} (${r.alternativa.prazoTexto})`));
      }
      console.log('');
      return;
    }

    const o = orcar({
      texto, servico,
      urgencia: process.argv[5] || 'normal',
      complexidade: process.argv[6] || 'simples'
    });
    console.log('');
    console.log(C.neg(`  ${o.servico} — R$ ${o.preco}`));
    console.log(`  prazo: ${o.prazoTexto}`);
    console.log('');
    for (const l of o.memoria) console.log(`  ${C.fraco(l)}`);
    console.log('');
  },

  async revisar() {
    const caminho = process.argv[3];
    const texto = ler(caminho);
    const alvo = parseInt(flag('alvo', '30'), 10);
    const saida = flag('saida', path.dirname(caminho));

    // Carregado aqui porque só este comando precisa de chave de API.
    const { revisar } = require('../src/estudio/revisor');

    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY não configurada — necessária só para revisar');
    }

    const antes = analisar(texto);
    console.log('');
    console.log(`  original: ${corDoScore(antes.score)}/100 · ${antes.metricas.palavras} palavras`);
    console.log(`  ${C.fraco('revisando (alvo ' + alvo + ')...')}`);

    const r = await revisar(texto, { alvo, instrucao: flag('instrucao', '') });

    for (const p of r.passes) {
      const marca = p.descartado ? C.fraco(' (descartado, não melhorou)') : '';
      console.log(`    passe ${p.passe}: ${p.scoreAntes} → ${p.scoreDepois}${marca}`);
    }

    const qa = verificar(texto, r.revisado);
    console.log('');
    console.log(`  resultado: ${corDoScore(r.analiseFinal.score)}/100  (${r.ganho > 0 ? '−' + r.ganho : 'sem ganho'})`);
    console.log(`  QA: ${qa.aprovado ? C.verde('aprovado') : C.verm(qa.bloqueios + ' bloqueio(s)')}`);
    for (const a of qa.alertas) {
      console.log(`    ${a.nivel === 'bloqueio' ? C.verm('■') : C.amar('▲')} ${a.mensagem}`);
    }

    const base = path.basename(caminho, path.extname(caminho));
    fs.mkdirSync(saida, { recursive: true });

    const fTexto = path.join(saida, `${base}-revisado.txt`);
    const fRel = path.join(saida, `${base}-relatorio.html`);

    fs.writeFileSync(fTexto, r.revisado, 'utf8');
    fs.writeFileSync(fRel, gerar({
      titulo: 'Relatório de revisão',
      original: texto, revisado: r.revisado,
      analiseInicial: r.analiseInicial, analiseFinal: r.analiseFinal,
      qa, servico: 'Revisão + humanização'
    }), 'utf8');

    console.log('');
    console.log(`  ${C.verde('✓')} ${fTexto}`);
    console.log(`  ${C.verde('✓')} ${fRel}`);
    console.log('');
  },

  async relatorio() {
    const original = ler(process.argv[3]);
    const revisado = ler(process.argv[4]);
    const destino = flag('saida', 'relatorio.html');

    const qa = verificar(original, revisado);
    const html = gerar({
      titulo: flag('titulo', 'Relatório de revisão'),
      cliente: flag('cliente', ''),
      servico: flag('servico', 'Revisão'),
      original, revisado,
      analiseInicial: analisar(original),
      analiseFinal: analisar(revisado),
      qa
    });

    fs.writeFileSync(destino, html, 'utf8');
    console.log('');
    console.log(`  ${C.verde('✓')} ${destino}  (${(html.length / 1024).toFixed(1)} KB)`);
    console.log(`  score ${analisar(original).score} → ${analisar(revisado).score} · QA ${qa.aprovado ? 'aprovado' : qa.bloqueios + ' bloqueio(s)'}`);
    console.log('');
  },

  async tabela() {
    console.log('');
    console.log(C.neg('  CATÁLOGO'));
    console.log('');
    for (const [id, s] of Object.entries(SERVICOS)) {
      const preco = s.modelo === 'fixo' ? `R$ ${s.preco}`
        : s.modelo === 'lauda' ? `R$ ${s.precoPorLauda}/lauda (mín. R$ ${s.minimo})`
        : s.modelo === 'peca' ? Object.entries(s.precoPorPeca).map(([k, v]) => `${k} R$ ${v}`).join(' · ')
        : s.faixas.map(f => `${f.nome} R$ ${f.preco}`).join(' · ');
      console.log(`  ${C.neg(id.padEnd(14))} ${s.nome}`);
      console.log(`  ${' '.repeat(14)} ${preco}`);
      console.log(`  ${' '.repeat(14)} ${C.fraco(s.descricao)}`);
      console.log('');
    }
    console.log(C.neg('  MULTIPLICADORES'));
    for (const [k, v] of Object.entries(URGENCIA)) console.log(`    urgência ${k.padEnd(10)} ×${v.fator}  ${C.fraco(v.rotulo)}`);
    for (const [k, v] of Object.entries(COMPLEXIDADE)) console.log(`    material ${k.padEnd(10)} ×${v.fator}  ${C.fraco(v.rotulo)}`);
    console.log('');
  }
};

async function main() {
  const cmd = process.argv[2];
  if (!cmd || !comandos[cmd]) {
    console.error(`\nComandos: ${Object.keys(comandos).join(', ')}\n`);
    console.error('  node scripts/texto.js analisar  texto.txt');
    console.error('  node scripts/texto.js orcar     texto.txt [servico] [urgencia] [complexidade]');
    console.error('  node scripts/texto.js revisar   texto.txt [--alvo 25] [--saida pasta/]');
    console.error('  node scripts/texto.js relatorio original.txt revisado.txt [--saida rel.html]');
    console.error('  node scripts/texto.js tabela\n');
    process.exit(1);
  }
  await comandos[cmd]();
}

main().catch(err => { console.error('\n❌ ' + err.message + '\n'); process.exit(1); });
