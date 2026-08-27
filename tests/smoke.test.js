/**
 * Smoke test — o app carrega e as rotas do agente registram?
 * Não precisa de Mongo: só verifica wiring, não runtime de banco.
 */
const assert = require('assert');
const express = require('express');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

teste('todos os módulos do agente carregam sem erro', () => {
  const mods = [
    '../src/agente/config', '../src/agente/prospector', '../src/agente/qualifier',
    '../src/agente/compliance', '../src/agente/mensageiro', '../src/agente/outreach',
    '../src/agente/loop', '../src/models/Prospect', '../src/routes/agente'
  ];
  for (const m of mods) {
    assert.doesNotThrow(() => require(m), 'falhou ao carregar ' + m);
  }
});

teste('rotas do agente montam no express (inclui wildcard de chave OSM)', () => {
  const app = express();
  app.use(express.json());
  assert.doesNotThrow(() => app.use('/api/agente', require('../src/routes/agente')));
});

teste('a chave OSM tem barra — a rota precisa do wildcard para não quebrar', () => {
  // chaveUnica = "osm:node/4871234567". Sem :chave(*) o Express corta na barra.
  const fonte = require('fs').readFileSync(__dirname + '/../src/routes/agente.js', 'utf8');
  assert.ok(fonte.includes(':chave(*)'), 'rotas de aprovar/rejeitar precisam aceitar barra na chave');
});

teste('iniciarAgente não faz nada quando AGENTE_ATIVO != true', () => {
  delete process.env.AGENTE_ATIVO;
  const { iniciarAgente } = require('../src/agente/loop');
  assert.doesNotThrow(() => iniciarAgente(), 'não pode quebrar com agente desligado');
});

teste('modo padrão é manual — autonomia total nunca é o default', () => {
  const { AGENTE } = require('../src/agente/config');
  assert.strictEqual(AGENTE.modo, 'manual', 'o default seguro é manual');
  assert.strictEqual(AGENTE.ativo, false, 'o agente não liga sozinho sem flag explícita');
});

teste('limites de segurança têm valores sãos', () => {
  const { AGENTE } = require('../src/agente/config');
  const l = AGENTE.limites;
  assert.ok(l.enviosPorDia > 0 && l.enviosPorDia <= 100, 'limite diário insano: ' + l.enviosPorDia);
  assert.ok(l.enviosPorHora <= l.enviosPorDia, 'limite horário não pode passar do diário');
  assert.ok(l.intervaloMinEntreEnviosMs >= 30000, 'intervalo curto demais queima o número');
  assert.ok(l.scoreMinimoParaAbordar >= 50, 'score mínimo baixo demais gera spam');
});

teste('janela de contato é comercial — nunca madrugada nem fim de semana', () => {
  const { AGENTE } = require('../src/agente/config');
  const j = AGENTE.janelaContato;
  assert.ok(j.horaInicio >= 8, 'início cedo demais: ' + j.horaInicio);
  assert.ok(j.horaFim <= 20, 'fim tarde demais: ' + j.horaFim);
  assert.ok(!j.diasSemana.includes(0) && !j.diasSemana.includes(6), 'não contatar fim de semana');
});

teste('cadência para em no máximo 4 toques', () => {
  const { AGENTE } = require('../src/agente/config');
  assert.ok(AGENTE.maxToques <= 4, 'mais de 4 toques sem resposta é perseguição');
  assert.strictEqual(AGENTE.cadencia.length, AGENTE.maxToques, 'cadência e maxToques divergem');
  const ultima = AGENTE.cadencia[AGENTE.cadencia.length - 1];
  assert.strictEqual(ultima.tipo, 'encerramento', 'a última mensagem tem que ser despedida');
});

teste('index.js registra as rotas do agente e inicia o loop', () => {
  const fonte = require('fs').readFileSync(__dirname + '/../src/index.js', 'utf8');
  assert.ok(fonte.includes("app.use('/api/agente'"), 'rotas do agente não montadas');
  assert.ok(fonte.includes('iniciarAgente()'), 'loop do agente não iniciado');
});

teste('scripts do repositório compilam (inclui createClient)', () => {
  const { execFileSync } = require('child_process');
  const fs = require('fs');
  const dir = __dirname + '/../scripts';
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
    assert.doesNotThrow(
      () => execFileSync(process.execPath, ['--check', dir + '/' + f], { stdio: 'pipe' }),
      'erro de sintaxe em scripts/' + f
    );
  }
});

let ok = 0, falhas = 0;
for (const t of testes) {
  try { t.fn(); console.log('  ✓ ' + t.nome); ok++; }
  catch (err) { console.log('  ✗ ' + t.nome + '\n      ' + err.message); falhas++; }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
