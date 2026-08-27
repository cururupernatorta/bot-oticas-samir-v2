/**
 * Testes do prospector — lógica pura, sem rede e sem Mongo.
 * Rodar: npm test
 */
const assert = require('assert');
const { normalizarTelefone, extrairProspect, montarQuery } = require('../src/agente/prospector');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

// ── normalizarTelefone ──────────────────────────────────────────────
teste('normaliza celular com +55 e máscara', () => {
  assert.strictEqual(normalizarTelefone('+55 91 98765-4321'), '5591987654321');
});
teste('normaliza fixo sem DDI', () => {
  assert.strictEqual(normalizarTelefone('(91) 3234-5678'), '559132345678');
});
teste('remove zero à esquerda do DDD', () => {
  assert.strictEqual(normalizarTelefone('091 98765 4321'), '5591987654321');
});
teste('pega só o primeiro de uma lista separada por ;', () => {
  assert.strictEqual(normalizarTelefone('+55 91 98765-4321;+55 91 3234-5678'), '5591987654321');
});
teste('rejeita número curto demais', () => {
  assert.strictEqual(normalizarTelefone('1234'), null);
});
teste('rejeita vazio e nulo', () => {
  assert.strictEqual(normalizarTelefone(''), null);
  assert.strictEqual(normalizarTelefone(null), null);
});
teste('rejeita número longo demais (erro de digitação no OSM)', () => {
  assert.strictEqual(normalizarTelefone('+55 91 98765-43210987'), null);
});

// ── extrairProspect (payload real da Overpass API) ──────────────────
const elementoReal = {
  type: 'node',
  id: 4871234567,
  lat: -1.4558,
  lon: -48.4902,
  tags: {
    name: 'Ótica Visão Clara',
    shop: 'optician',
    'addr:street': 'Avenida Nazaré',
    'addr:housenumber': '850',
    'addr:suburb': 'Nazaré',
    phone: '+55 91 3241-5566',
    'contact:whatsapp': '+55 91 98123-4567',
    website: 'https://oticavisaoclara.com.br',
    opening_hours: 'Mo-Fr 09:00-18:00; Sa 09:00-13:00'
  }
};

teste('extrai prospect completo de um nó real do OSM', () => {
  const p = extrairProspect(elementoReal, 'otica', 'Belém');
  assert.strictEqual(p.nome, 'Ótica Visão Clara');
  assert.strictEqual(p.chaveUnica, 'osm:node/4871234567');
  assert.strictEqual(p.nicho, 'otica');
  assert.strictEqual(p.cidade, 'Belém');
  assert.strictEqual(p.site, 'https://oticavisaoclara.com.br');
  assert.strictEqual(p.endereco, 'Avenida Nazaré, 850, Nazaré');
  assert.strictEqual(p.horarioPublicado, 'Mo-Fr 09:00-18:00; Sa 09:00-13:00');
  assert.strictEqual(p.fonte, 'openstreetmap');
});

teste('prefere contact:whatsapp sobre phone', () => {
  const p = extrairProspect(elementoReal, 'otica', 'Belém');
  assert.strictEqual(p.telefone, '5591981234567', 'deveria usar o whatsapp, não o fixo');
  assert.strictEqual(p.temWhatsappDeclarado, true);
});

teste('cai para phone quando não há whatsapp declarado', () => {
  const sem = { ...elementoReal, tags: { ...elementoReal.tags } };
  delete sem.tags['contact:whatsapp'];
  const p = extrairProspect(sem, 'otica', 'Belém');
  assert.strictEqual(p.telefone, '559132415566');
  assert.strictEqual(p.temWhatsappDeclarado, false);
});

teste('descarta elemento sem nome', () => {
  const semNome = { type: 'node', id: 1, tags: { shop: 'optician', phone: '+55 91 3241-5566' } };
  assert.strictEqual(extrairProspect(semNome, 'otica', 'Belém'), null);
});

teste('descarta elemento sem telefone — não entra no pipeline', () => {
  const semTel = { type: 'node', id: 2, tags: { name: 'Ótica Sem Contato', shop: 'optician' } };
  assert.strictEqual(extrairProspect(semTel, 'otica', 'Belém'), null);
});

teste('lida com way (polígono) além de node', () => {
  const way = { type: 'way', id: 999, tags: { name: 'Ótica Grande', phone: '+55 91 3241-5566' } };
  const p = extrairProspect(way, 'otica', 'Belém');
  assert.strictEqual(p.chaveUnica, 'osm:way/999');
});

teste('chaveUnica é estável — mesmo elemento nunca duplica', () => {
  const a = extrairProspect(elementoReal, 'otica', 'Belém');
  const b = extrairProspect(elementoReal, 'otica', 'Belém');
  assert.strictEqual(a.chaveUnica, b.chaveUnica);
});

// ── montarQuery ─────────────────────────────────────────────────────
teste('monta Overpass QL com chave e valor separados', () => {
  const q = montarQuery('shop=optician', 'Belém');
  assert.ok(q.includes('node["shop"="optician"]'), 'deveria ter o filtro de node');
  assert.ok(q.includes('way["shop"="optician"]'), 'deveria ter o filtro de way');
  assert.ok(q.includes('area["name"="Belém"]'), 'deveria escopar pela cidade');
  assert.ok(q.includes('[out:json]'), 'deveria pedir JSON');
});

// ── runner ──────────────────────────────────────────────────────────
let ok = 0, falhas = 0;
for (const t of testes) {
  try {
    t.fn();
    console.log('  ✓ ' + t.nome);
    ok++;
  } catch (err) {
    console.log('  ✗ ' + t.nome + '\n      ' + err.message);
    falhas++;
  }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
