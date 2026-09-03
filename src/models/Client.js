const { getDB } = require('../config/database');
const { getPlano } = require('../config/planos');
const { aplicarNicho, getNicho } = require('../config/nichos');
const { FUSO_PADRAO } = require('../utils/horarios');

const COL = 'clients';

async function getClientById(clientId) {
  return await getDB().collection(COL).findOne({ clientId, ativo: true });
}

/**
 * Monta o documento do cliente. O pacote de nicho preenche tudo que veio vazio;
 * o que o operador digitou no onboarding sempre prevalece.
 */
function montarDocumento(data = {}) {
  const plano = getPlano(data.plano || 'pro');
  const d = aplicarNicho(data);
  const nicho = getNicho(d.nicho);

  return {
    clientId: d.clientId,
    nomeEmpresa: d.nomeEmpresa,
    nomeBot: d.nomeBot,

    // Identidade de nicho
    nicho: d.nicho,
    vocabulario: d.vocabulario,
    objetivo: d.objetivo,
    qualificacao: d.qualificacao,
    gatilhosHumano: d.gatilhosHumano,

    // Base de conhecimento
    descricao: d.descricao,
    conhecimento: d.conhecimento,
    limites: d.limites,
    faq: d.faq,

    // Canal
    zapiInstanceId: d.zapiInstanceId,
    zapiToken: d.zapiToken,
    // Para onde vai o relatório semanal do cliente (default: 1ª unidade)
    whatsappGestor: d.whatsappGestor || null,

    // Operação
    lojas: d.lojas || d.unidades || {},
    fusoHorario: d.fusoHorario || FUSO_PADRAO,
    horarioComercial: d.horarioComercial || {
      segSex: { inicio: '08:30', fim: '18:30' },
      sabado: { inicio: '08:30', fim: '13:00' },
      domingo: null
    },
    sempreAberto: d.sempreAberto === true,
    mensagemForaHorario: d.mensagemForaHorario ||
      'Oi! No momento estamos fora do horário de atendimento presencial, mas posso te ajudar por aqui agora mesmo. 😊',

    // Comercial
    plano: d.plano || 'pro',
    limiteMensagens: d.limiteMensagens ?? plano.limiteMensagens,
    precoMensal: d.precoMensal ?? plano.precoMensal,
    precoPorMensagemExcedente: d.precoPorMensagemExcedente ?? plano.precoPorMensagemExcedente,
    kpis: d.kpis || nicho.kpis || [],

    trialAte: d.trialAte || null,
    ativo: true,
    criadoEm: new Date()
  };
}

async function createClient(data) {
  const doc = montarDocumento(data);
  await getDB().collection(COL).insertOne(doc);
  return doc;
}

async function listClients() {
  return await getDB().collection(COL).find({ ativo: true }).toArray();
}

async function updateClient(clientId, updates) {
  const { _id, clientId: _ignore, criadoEm, ...limpo } = updates || {};
  await getDB().collection(COL).updateOne(
    { clientId },
    { $set: { ...limpo, atualizadoEm: new Date() } }
  );
}

async function deleteClient(clientId) {
  await getDB().collection(COL).updateOne(
    { clientId },
    { $set: { ativo: false, atualizadoEm: new Date() } }
  );
}

module.exports = { getClientById, createClient, listClients, updateClient, deleteClient, montarDocumento };
