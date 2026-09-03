/** Mongo em memória, apenas com o que a aplicação usa. Suficiente para o smoke test. */
function aplicar(doc, update) {
  if (update.$set) Object.assign(doc, update.$set);
  if (update.$inc) for (const [k, v] of Object.entries(update.$inc)) doc[k] = (doc[k] || 0) + v;
  if (update.$setOnInsert) for (const [k, v] of Object.entries(update.$setOnInsert)) if (doc[k] === undefined) doc[k] = v;
  return doc;
}

function casa(doc, filtro) {
  return Object.entries(filtro).every(([k, v]) => {
    if (k === '$or') return v.some(f => casa(doc, f));
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      return Object.entries(v).every(([op, alvo]) => {
        switch (op) {
          case '$lt': return doc[k] != null && doc[k] < alvo;
          case '$gt': return doc[k] != null && doc[k] > alvo;
          case '$gte': return doc[k] != null && doc[k] >= alvo;
          case '$exists': return (doc[k] !== undefined) === alvo;
          default: return false;
        }
      });
    }
    return doc[k] === v;
  });
}

class Colecao {
  constructor() { this.docs = []; this.seq = 0; }
  async findOne(filtro) { return this.docs.find(d => casa(d, filtro)) || null; }
  async insertOne(doc) { doc._id = doc._id || ++this.seq; this.docs.push(doc); return { insertedId: doc._id }; }
  async updateOne(filtro, update, opts = {}) {
    const doc = this.docs.find(d => casa(d, filtro));
    if (doc) { aplicar(doc, update); return { modifiedCount: 1 }; }
    if (opts.upsert) { const novo = aplicar({ ...filtro }, update); return this.insertOne(novo); }
    return { modifiedCount: 0 };
  }
  find(filtro = {}) {
    let r = this.docs.filter(d => casa(d, filtro));
    const api = { sort: () => api, limit: n => { r = r.slice(0, n); return api; }, toArray: async () => r };
    return api;
  }
}

const colecoes = {};
const db = { collection: nome => (colecoes[nome] = colecoes[nome] || new Colecao()) };

module.exports = { db, colecoes };
