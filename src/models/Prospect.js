const { getDB } = require('../config/database');
const COL = 'prospects';

/**
 * PROSPECT — empresa descoberta pelo agente, ainda não cliente.
 *
 * Ciclo de vida do status:
 *   descoberto → qualificado → aprovado → abordado → respondeu → convertido
 *                     ↓            ↓                      ↓
 *                 descartado   rejeitado              descadastrado
 */

async function upsertProspect(dados) {
  const agora = new Date();
  const res = await getDB().collection(COL).findOneAndUpdate(
    { chaveUnica: dados.chaveUnica },
    {
      $set: { ...dados, atualizadoEm: agora },
      $setOnInsert: {
        status: 'descoberto',
        score: null,
        motivoScore: null,
        toques: 0,
        historicoContato: [],
        criadoEm: agora
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  return res.value || res;
}

async function listarProspects(filtro = {}, limite = 100) {
  return await getDB().collection(COL)
    .find(filtro).sort({ score: -1, criadoEm: -1 }).limit(limite).toArray();
}

async function getProspect(chaveUnica) {
  return await getDB().collection(COL).findOne({ chaveUnica });
}

async function atualizarProspect(chaveUnica, updates) {
  await getDB().collection(COL).updateOne(
    { chaveUnica },
    { $set: { ...updates, atualizadoEm: new Date() } }
  );
}

/** Registra um toque de contato e incrementa o contador de cadência. */
async function registrarToque(chaveUnica, toque) {
  await getDB().collection(COL).updateOne(
    { chaveUnica },
    {
      $inc: { toques: 1 },
      $push: { historicoContato: { ...toque, em: new Date() } },
      $set: { ultimoContatoEm: new Date(), atualizadoEm: new Date() }
    }
  );
}

/** Fila do que já foi escrito pelo agente e espera aprovação humana. */
async function filaAprovacao(limite = 50) {
  return await getDB().collection(COL)
    .find({ status: 'qualificado', mensagemPendente: { $ne: null, $exists: true } })
    .sort({ score: -1 }).limit(limite).toArray();
}

/** Prospects prontos para o próximo toque da cadência. */
async function prontosParaFollowup(aposDias, etapa) {
  const limite = new Date(Date.now() - aposDias * 24 * 60 * 60 * 1000);
  return await getDB().collection(COL).find({
    status: 'abordado',
    toques: etapa - 1,
    ultimoContatoEm: { $lt: limite }
  }).limit(50).toArray();
}

async function contarPorStatus() {
  const linhas = await getDB().collection(COL).aggregate([
    { $group: { _id: '$status', total: { $sum: 1 } } }
  ]).toArray();
  return linhas.reduce((acc, l) => ({ ...acc, [l._id]: l.total }), {});
}

module.exports = {
  upsertProspect, listarProspects, getProspect, atualizarProspect,
  registrarToque, filaAprovacao, prontosParaFollowup, contarPorStatus
};
