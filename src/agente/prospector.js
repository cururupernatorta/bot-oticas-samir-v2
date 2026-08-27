const axios = require('axios');
const { AGENTE, getNicho } = require('./config');
const { upsertProspect } = require('../models/Prospect');

/**
 * PROSPECTOR — descoberta de empresas reais, de graça.
 *
 * Fonte: Overpass API (OpenStreetMap). Escolha deliberada:
 *   • sem API key, sem cartão de crédito, sem cota paga
 *   • dado público e comercial (telefone/site que a empresa PUBLICOU)
 *   • cobre bem comércio local brasileiro
 *
 * Google Places dá mais dados (reviews, rating) mas exige billing.
 * Se um dia quiser, plugue aqui um segundo adapter — o resto do
 * pipeline não muda, porque todos normalizam para o mesmo formato.
 */

const OVERPASS = 'https://overpass-api.de/api/interpreter';

/** "+55 (91) 98765-4321" → "5591987654321" (formato Z-API). */
function normalizarTelefone(bruto) {
  if (!bruto) return null;
  let d = String(bruto).split(';')[0].replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = d.replace(/^0+/, '');
  if (!d.startsWith('55')) d = '55' + d;
  // 55 + DDD(2) + 8 ou 9 dígitos
  if (d.length < 12 || d.length > 13) return null;
  return d;
}

function montarQuery(osmTag, cidade) {
  const [chave, valor] = osmTag.split('=');
  return `[out:json][timeout:60];
area["name"="${cidade}"]["boundary"="administrative"]->.cidade;
(
  node["${chave}"="${valor}"](area.cidade);
  way["${chave}"="${valor}"](area.cidade);
);
out center tags 200;`;
}

function extrairProspect(el, nichoId, cidade) {
  const t = el.tags || {};
  const nome = t.name;
  if (!nome) return null;

  const telefone = normalizarTelefone(
    t['contact:whatsapp'] || t.phone || t['contact:phone'] || t['contact:mobile']
  );
  if (!telefone) return null; // sem canal de contato não serve pro pipeline

  return {
    chaveUnica: `osm:${el.type}/${el.id}`,
    nome,
    nicho: nichoId,
    cidade,
    telefone,
    temWhatsappDeclarado: Boolean(t['contact:whatsapp']),
    site: t.website || t['contact:website'] || null,
    instagram: t['contact:instagram'] || null,
    endereco: [t['addr:street'], t['addr:housenumber'], t['addr:suburb']]
      .filter(Boolean).join(', ') || null,
    horarioPublicado: t.opening_hours || null,
    fonte: 'openstreetmap',
    coletadoEm: new Date()
  };
}

/** Busca um nicho em uma cidade. Retorna prospects normalizados. */
async function buscarNicho(nichoId, cidade) {
  const nicho = getNicho(nichoId);
  const query = montarQuery(nicho.osm, cidade);

  try {
    const res = await axios.post(OVERPASS, query, {
      headers: { 'Content-Type': 'text/plain' },
      timeout: 90000
    });
    const elementos = res.data?.elements || [];
    const prospects = elementos
      .map(el => extrairProspect(el, nichoId, cidade))
      .filter(Boolean);

    console.log(`[PROSPECTOR] ${nicho.label} em ${cidade}: ${elementos.length} locais, ${prospects.length} com telefone`);
    return prospects;
  } catch (err) {
    console.error(`[PROSPECTOR ERRO] ${nicho.label}/${cidade}:`, err.response?.status || err.message);
    return [];
  }
}

/**
 * Ciclo de prospecção: varre nichos × cidades até o limite do ciclo,
 * grava tudo no Mongo e devolve só o que é novo.
 */
async function rodarProspeccao({ nichos, cidades, limite } = {}) {
  const alvoNichos = nichos || AGENTE.nichos.map(n => n.id);
  const alvoCidades = cidades || AGENTE.cidades;
  const max = limite || AGENTE.limites.prospeccoesPorCiclo;

  const novos = [];
  let coletados = 0;

  for (const cidade of alvoCidades) {
    for (const nichoId of alvoNichos) {
      if (coletados >= max) break;

      const encontrados = await buscarNicho(nichoId, cidade);
      for (const p of encontrados) {
        if (coletados >= max) break;
        const antes = await upsertProspect(p);
        coletados++;
        if (!antes || antes.status === 'descoberto') novos.push(p);
      }

      // Overpass é infraestrutura pública e gratuita. Respeite: 1 req a cada 3s.
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`[PROSPECTOR] ciclo concluído: ${coletados} processados, ${novos.length} novos`);
  return novos;
}

module.exports = { rodarProspeccao, buscarNicho, normalizarTelefone, extrairProspect, montarQuery };
