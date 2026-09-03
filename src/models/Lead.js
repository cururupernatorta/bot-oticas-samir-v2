const { getDB } = require('../config/database');
const COL = 'leads';

async function criarLead(clientId, phone, lojaKey, lojaNome, resumo, historico) {
  return await getDB().collection(COL).insertOne({
    clientId, phone, lojaKey, lojaNome, resumo, historico,
    status: 'novo',
    alertas: 0,
    ultimoAlerta: null,
    atendente: null,
    assumidoEm: null,
    resolvidoEm: null,
    criadoEm: new Date()
  });
}

async function assumirLead(clientId, phone, atendente) {
  await getDB().collection(COL).updateOne(
    { clientId, phone, status: 'novo' },
    { $set: { status: 'em_atendimento', atendente, assumidoEm: new Date() } }
  );
}

async function listarLeads(clientId, status) {
  const filtro = { clientId };
  if (status) filtro.status = status;
  return await getDB().collection(COL).find(filtro).sort({ criadoEm: -1 }).limit(100).toArray();
}

/**
 * Leads ainda não assumidos, elegíveis para alerta.
 * Alerta no máximo `maxAlertas` vezes, respeitando o intervalo — antes disso
 * o mesmo lead era re-alertado a cada rodada do cron, para sempre.
 */
async function leadNaoRespondido(clientId, minutos = 30, maxAlertas = 2) {
  const limite = new Date(Date.now() - minutos * 60 * 1000);
  return await getDB().collection(COL).find({
    clientId,
    status: 'novo',
    criadoEm: { $lt: limite },
    alertas: { $lt: maxAlertas },
    $or: [{ ultimoAlerta: null }, { ultimoAlerta: { $exists: false } }, { ultimoAlerta: { $lt: limite } }]
  }).toArray();
}

async function registrarAlerta(leadId) {
  await getDB().collection(COL).updateOne(
    { _id: leadId },
    { $inc: { alertas: 1 }, $set: { ultimoAlerta: new Date() } }
  );
}

module.exports = { criarLead, assumirLead, listarLeads, leadNaoRespondido, registrarAlerta };
