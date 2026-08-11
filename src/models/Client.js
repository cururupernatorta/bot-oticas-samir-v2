const { getDB } = require('../config/database');
const { getPlano } = require('../config/planos');
const COL = 'clients';

async function getClientById(clientId) {
  return await getDB().collection(COL).findOne({ clientId, ativo: true });
}

async function createClient(data) {
  const plano = getPlano(data.plano || 'pro');

  const doc = {
    clientId: data.clientId,
    nomeEmpresa: data.nomeEmpresa,
    nomeBot: data.nomeBot || 'Ana',
    nicho: data.nicho || 'geral',
    descricao: data.descricao || '',
    conhecimento: data.conhecimento || '',
    limites: data.limites || '',
    faq: data.faq || [],
    zapiInstanceId: data.zapiInstanceId,
    zapiToken: data.zapiToken,
    lojas: data.lojas || {},
    horarioComercial: data.horarioComercial || {
      segSex: { inicio: '08:30', fim: '18:30' },
      sabado: { inicio: '08:30', fim: '13:00' },
      domingo: null
    },
    mensagemForaHorario: data.mensagemForaHorario ||
      'Oi! No momento estamos fora do horário. Assim que reabrirmos, respondemos você! 😊',

    plano: data.plano || 'pro',
    limiteMensagens: data.limiteMensagens ?? plano.limiteMensagens,
    precoMensal: data.precoMensal ?? plano.precoMensal,
    precoPorMensagemExcedente: data.precoPorMensagemExcedente ?? plano.precoPorMensagemExcedente,

    trialAte: data.trialAte || null,
    ativo: true,
    criadoEm: new Date()
  };
  await getDB().collection(COL).insertOne(doc);
  return doc;
}

async function listClients() {
  return await getDB().collection(COL).find({ ativo: true }).toArray();
}

async function updateClient(clientId, updates) {
  await getDB().collection(COL).updateOne(
    { clientId },
    { $set: { ...updates, atualizadoEm: new Date() } }
  );
}

async function deleteClient(clientId) {
  await getDB().collection(COL).updateOne(
    { clientId },
    { $set: { ativo: false, atualizadoEm: new Date() } }
  );
}

module.exports = { getClientById, createClient, listClients, updateClient, deleteClient };
