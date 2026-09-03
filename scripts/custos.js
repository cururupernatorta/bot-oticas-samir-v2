#!/usr/bin/env node
/**
 * CALCULADORA DE CUSTOS — Atende24
 *
 *   npm run custos                      cenário padrão (10 clientes / 1 servidor)
 *   npm run custos -- --msgs 8000       custo de um cliente com 8.000 msgs/mês
 *   npm run custos -- --ttl 5m          comparar TTL de cache
 *   npm run custos -- --cambio 5.80     estressar o câmbio
 *
 * Toda premissa está em PREMISSAS, abaixo. Quando um fornecedor mudar de preço,
 * mude aqui e rode de novo — nenhum número deste projeto é digitado à mão.
 */

const { TABELA_USD_POR_MILHAO, MULT_ESCRITA_5M, MULT_ESCRITA_1H, MULT_LEITURA } = require('../src/utils/custoTokens');

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};

const PREMISSAS = {
  cambio: parseFloat(arg('cambio', '5.40')),   // cotação + IOF 3,5% + spread do cartão
  modelo: arg('modelo', 'claude-sonnet-5'),
  ttl: arg('ttl', '1h'),

  // ── Formato da conversa (medido em src/utils/systemPrompt.js) ──────────────
  tokensSystemPrompt: 1750,   // prompt de cliente com conhecimento cheio e 3 unidades
  tokensHistorico: 120,       // 8 turnos curtos de WhatsApp + <contexto_atual>
  tokensSaida: 90,            // resposta típica do bot

  // ── Comportamento do tráfego ──────────────────────────────────────────────
  fracaoSemIA: 0.30,          // FAQ + saudações + emoji: respondidos sem chamar o modelo
  diasAtivosMes: 30,
  horasAtivasDia: 14,         // janela em que realmente chega mensagem
  leadsPorMilMensagens: 25,   // cada lead dispara 1 chamada extra (resumo, sem cache)
  tokensResumoEntrada: 700,
  tokensResumoSaida: 160,

  // ── Fornecedores ──────────────────────────────────────────────────────────
  wameMensalPorInstancia: parseFloat(arg('wame', '28.99')),
  servidorMensal: parseFloat(arg('servidor', '75')),   // VPS 4 vCPU / 8 GB + backup
  clientesPorServidor: parseInt(arg('clientes', '10'), 10),
  suportePorCliente: 40,

  // ── Custos do NEGÓCIO (não do produto) ────────────────────────────────────
  // Sem estes, a margem parece 88% e você fecha o mês achando que sobrou mais
  // do que sobrou. Simples Nacional Anexo III começa em 6% e sobe por faixa.
  aliquotaImposto: 0.06,        // Simples Nacional — confirme a sua faixa com o contador
  taxaGateway: 0.035,           // boleto/cartão recorrente
  inadimplencia: 0.03,          // parcela do MRR que não entra no mês
  contadorMensal: 350
};

const P = PREMISSAS;
const preco = TABELA_USD_POR_MILHAO[P.modelo] || TABELA_USD_POR_MILHAO['claude-sonnet-5'];
const multEscrita = P.ttl === '1h' ? MULT_ESCRITA_1H : MULT_ESCRITA_5M;
const ttlMinutos = P.ttl === '1h' ? 60 : 5;
const brl = usd => usd * P.cambio;
const fmt = (n, c = 2) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });

/**
 * Fração de mensagens que encontra o cache quente.
 *
 * O system prompt é IDÊNTICO em todas as conversas de um mesmo cliente, então
 * uma única entrada de cache serve o cliente inteiro: qualquer mensagem de
 * qualquer consumidor mantém a entrada viva. Modelando as chegadas como um
 * processo de Poisson com taxa λ, a chance de a mensagem anterior ter ocorrido
 * dentro da janela do TTL é 1 - e^(-λ·TTL).
 */
function fracaoCacheQuente(msgsIAporMes) {
  const minutosAtivos = P.diasAtivosMes * P.horasAtivasDia * 60;
  const lambda = msgsIAporMes / minutosAtivos;          // mensagens por minuto
  return 1 - Math.exp(-lambda * ttlMinutos);
}

function custoIA(msgsMes) {
  const msgsIA = msgsMes * (1 - P.fracaoSemIA);
  const hit = fracaoCacheQuente(msgsIA);

  const leituras = msgsIA * hit * P.tokensSystemPrompt;
  const escritas = msgsIA * (1 - hit) * P.tokensSystemPrompt;
  const entradaNormal = msgsIA * P.tokensHistorico;
  const saida = msgsIA * P.tokensSaida;

  const leads = (msgsMes / 1000) * P.leadsPorMilMensagens;
  const resumoEntrada = leads * P.tokensResumoEntrada;
  const resumoSaida = leads * P.tokensResumoSaida;

  const usd = (
      leituras * preco.entrada * MULT_LEITURA
    + escritas * preco.entrada * multEscrita
    + (entradaNormal + resumoEntrada) * preco.entrada
    + (saida + resumoSaida) * preco.saida
  ) / 1e6;

  // Contrafactual: mesmo tráfego sem nenhum cache
  const usdSemCache = (
      (msgsIA * (P.tokensSystemPrompt + P.tokensHistorico) + resumoEntrada) * preco.entrada
    + (saida + resumoSaida) * preco.saida
  ) / 1e6;

  return {
    msgsIA: Math.round(msgsIA), leads: Math.round(leads),
    cacheQuente: hit,
    brl: brl(usd), brlSemCache: brl(usdSemCache),
    porMensagem: brl(usd) / msgsMes,
    cacheavel: P.tokensSystemPrompt >= preco.minimoCache
  };
}

function custoCliente(msgsMes) {
  const ia = custoIA(msgsMes);
  const infra = P.servidorMensal / P.clientesPorServidor;
  const total = ia.brl + P.wameMensalPorInstancia + P.suportePorCliente + infra;
  return { ia, wame: P.wameMensalPorInstancia, suporte: P.suportePorCliente, infra, total };
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║  CUSTO OPERACIONAL — Atende24                                    ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log(`\nPremissas: ${P.modelo} · cache TTL ${P.ttl} · câmbio efetivo R$ ${P.cambio.toFixed(2)}/US$`);
console.log(`           WAME R$ ${P.wameMensalPorInstancia.toFixed(2)}/instância · servidor R$ ${P.servidorMensal.toFixed(2)} ÷ ${P.clientesPorServidor} clientes`);
console.log(`           system prompt ${P.tokensSystemPrompt} tokens · ${(P.fracaoSemIA * 100).toFixed(0)}% das msgs respondidas sem IA\n`);

if (P.tokensSystemPrompt < preco.minimoCache) {
  console.log(`⚠️  ATENÇÃO: ${P.modelo} exige ${preco.minimoCache} tokens para cachear.`);
  console.log(`   Nosso prompt tem ${P.tokensSystemPrompt} — o cache seria IGNORADO em silêncio.\n`);
}

console.log('── Custo de IA por volume mensal ─────────────────────────────────');
console.log('  msgs/mês │ cache quente │  com cache │  sem cache │  economia │  R$/msg');
for (const m of [1000, 2500, 3000, 5000, 8000, 12000, 20000]) {
  const c = custoIA(m);
  console.log(
    `  ${String(m).padStart(8)} │ ${(c.cacheQuente * 100).toFixed(1).padStart(11)}% │ ${fmt(c.brl).padStart(10)} │ ${fmt(c.brlSemCache).padStart(10)} │ ${((1 - c.brl / c.brlSemCache) * 100).toFixed(0).padStart(8)}% │ ${fmt(c.porMensagem, 4)}`
  );
}

console.log('\n── Custo total por cliente, por plano ────────────────────────────');
const { PLANOS } = require('../src/config/planos');
console.log('  plano       │ receita │      IA │  WAME │ suporte │ infra │  custo │  lucro │ margem');
let mrr = 0, custoTotal = 0;
for (const [id, plano] of Object.entries(PLANOS)) {
  const c = custoCliente(plano.limiteMensagens);
  const lucro = plano.precoMensal - c.total;
  mrr += plano.precoMensal; custoTotal += c.total;
  console.log(
    `  ${plano.nome.padEnd(11)} │ ${String(plano.precoMensal).padStart(7)} │ ${c.ia.brl.toFixed(2).padStart(7)} │ ${c.wame.toFixed(2).padStart(5)} │ ${c.suporte.toFixed(2).padStart(7)} │ ${c.infra.toFixed(2).padStart(5)} │ ${c.total.toFixed(2).padStart(6)} │ ${lucro.toFixed(2).padStart(6)} │ ${((lucro / plano.precoMensal) * 100).toFixed(1).padStart(5)}%`
  );
}

console.log('\n── Servidor com 10 clientes (mix realista) ───────────────────────');
const mix = { essencial: 3, start: 2, pro: 4, enterprise: 1 };
let mrrMix = 0, custoMix = 0, msgsMix = 0, iaMix = 0;
for (const [id, qtd] of Object.entries(mix)) {
  const plano = PLANOS[id];
  const c = custoCliente(plano.limiteMensagens);
  mrrMix += plano.precoMensal * qtd;
  custoMix += c.total * qtd;
  iaMix += c.ia.brl * qtd;
  msgsMix += plano.limiteMensagens * qtd;
  console.log(`  ${qtd}× ${plano.nome.padEnd(11)} → receita ${fmt(plano.precoMensal * qtd).padStart(12)} · custo ${fmt(c.total * qtd).padStart(10)}`);
}
console.log('  ' + '─'.repeat(62));
console.log(`  Mensagens/mês no servidor .......... ${msgsMix.toLocaleString('pt-BR')}`);
console.log(`  MRR ................................ ${fmt(mrrMix)}`);
console.log(`  Custo total ........................ ${fmt(custoMix)}   (IA: ${fmt(iaMix)})`);
console.log(`  LUCRO .............................. ${fmt(mrrMix - custoMix)}`);
console.log(`  Margem ............................. ${(((mrrMix - custoMix) / mrrMix) * 100).toFixed(1)}%`);
console.log(`  Custo fixo se todos cancelarem ..... ${fmt(P.servidorMensal)} (só o servidor)`);

console.log('\n── Do lucro operacional ao que sobra de verdade ──────────────────');
const imposto = mrrMix * P.aliquotaImposto;
const gateway = mrrMix * P.taxaGateway;
const perdido = mrrMix * P.inadimplencia;
const lucroReal = mrrMix - custoMix - imposto - gateway - perdido - P.contadorMensal;
const linha = (rot, v, sinal = '-') => console.log(`  ${sinal} ${rot.padEnd(38, '.')} ${fmt(v).padStart(12)}`);
console.log(`    ${'MRR bruto'.padEnd(38, '.')} ${fmt(mrrMix).padStart(12)}`);
linha('Custo de operação (IA+WAME+infra+suporte)', custoMix);
linha(`Imposto (Simples ${(P.aliquotaImposto * 100).toFixed(1)}%)`, imposto);
linha(`Gateway de pagamento (${(P.taxaGateway * 100).toFixed(1)}%)`, gateway);
linha(`Inadimplência (${(P.inadimplencia * 100).toFixed(1)}%)`, perdido);
linha('Contador', P.contadorMensal);
console.log('  ' + '─'.repeat(62));
console.log(`    ${'LUCRO REAL'.padEnd(38, '.')} ${fmt(lucroReal).padStart(12)}   (${((lucroReal / mrrMix) * 100).toFixed(1)}% do MRR)`);
console.log(`    ${'Por cliente'.padEnd(38, '.')} ${fmt(lucroReal / P.clientesPorServidor).padStart(12)}`);

console.log('\n── Capacidade do servidor (o gargalo NÃO é CPU) ──────────────────');
{
  const msgsDia = msgsMix / 30;
  const porMinutoMedio = msgsDia / (P.horasAtivasDia * 60);
  const picoFator = 8;                       // sexta 20h num delivery
  const porMinutoPico = porMinutoMedio * picoFator;
  const segChamadaIA = 4;                    // tempo médio da chamada ao modelo
  const concorrentesPico = (porMinutoPico / 60) * segChamadaIA;

  const cpuMsPorMsg = 5;                     // parse + montagem do prompt + 2 ops Mongo
  const cpuPicoPct = (porMinutoPico * cpuMsPorMsg) / (60 * 1000) * 100;

  const convAtivas = msgsMix * 0.3;          // ~30% das msgs abrem conversa distinta
  const discoMb = (convAtivas * 2 * 3) / 1024 * 1024 / 1024; // 2 meses de TTL, 3 KB/doc
  const ramMongoMb = (convAtivas * 2 * 3) / 1024 + 120;

  const l = (rot, val) => console.log(`  ${rot.padEnd(42, '.')} ${val}`);
  l('Mensagens/dia no servidor', Math.round(msgsDia).toLocaleString('pt-BR'));
  l('Mensagens/minuto (média na janela ativa)', porMinutoMedio.toFixed(1));
  l(`Mensagens/minuto no pico (${picoFator}x)`, porMinutoPico.toFixed(1));
  l('Chamadas de IA simultâneas no pico', concorrentesPico.toFixed(1));
  l('Uso de CPU no pico (1 núcleo)', cpuPicoPct.toFixed(2) + '%');
  l('RAM estimada do MongoDB', Math.round(ramMongoMb) + ' MB');
  l('Disco em regime (TTL de 60 dias)', Math.round(discoMb) + ' MB');
  console.log('');
  console.log('  → Um VPS de 4 vCPU / 8 GB fica com ~20x de folga nesse mix.');
  console.log('  → Tecnicamente ele aguentaria 50+ clientes. O limite de 10 é');
  console.log('    de RISCO e SUPORTE, não de capacidade: um servidor caído são');
  console.log('    10 contratos parados, e 10 clientes já ocupam uma pessoa.');
}

console.log('\n── Comparações que mudam a decisão ───────────────────────────────');
function cenarioIA({ ttl, modelo, tokens }) {
  const pr = TABELA_USD_POR_MILHAO[modelo];
  const mult = ttl === '1h' ? MULT_ESCRITA_1H : MULT_ESCRITA_5M;
  const ttlMin = ttl === '1h' ? 60 : 5;
  const cacheia = tokens >= pr.minimoCache;
  const msgsIA = 8000 * (1 - P.fracaoSemIA);
  const lambda = msgsIA / (P.diasAtivosMes * P.horasAtivasDia * 60);
  const hit = cacheia ? 1 - Math.exp(-lambda * ttlMin) : 0;
  const usd = (
      msgsIA * hit * tokens * pr.entrada * MULT_LEITURA
    + msgsIA * (1 - hit) * tokens * pr.entrada * (cacheia ? mult : 1)
    + msgsIA * P.tokensHistorico * pr.entrada
    + msgsIA * P.tokensSaida * pr.saida
  ) / 1e6;
  return { brl: brl(usd), hit, cacheia };
}
const cenarios = [
  ['Sonnet 5 · cache TTL 1h  (padrão)', { ttl: '1h', modelo: 'claude-sonnet-5', tokens: P.tokensSystemPrompt }],
  ['Sonnet 5 · cache TTL 5min', { ttl: '5m', modelo: 'claude-sonnet-5', tokens: P.tokensSystemPrompt }],
  ['Haiku 4.5 · tentando cachear', { ttl: '1h', modelo: 'claude-haiku-4-5', tokens: P.tokensSystemPrompt }],
  ['Opus 5 · cache TTL 1h', { ttl: '1h', modelo: 'claude-opus-5', tokens: P.tokensSystemPrompt }]
];
console.log('  (cliente Pro, 8.000 msgs/mês)');
for (const [nome, cfg] of cenarios) {
  const r = cenarioIA(cfg);
  const nota = r.cacheia ? `cache ${(r.hit * 100).toFixed(0)}%` : 'NÃO CACHEIA (prompt < mínimo)';
  console.log(`  ${nome.padEnd(36)} ${fmt(r.brl).padStart(10)} /mês   ${nota}`);
}
console.log('');
