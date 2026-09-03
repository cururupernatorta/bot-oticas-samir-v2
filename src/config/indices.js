/**
 * ÍNDICES DO MONGODB — criados no boot, idempotentes.
 *
 * Sem isto, cada mensagem recebida fazia varredura completa da coleção
 * `conversations`. Com 10 clientes a coleção passa de 200 mil documentos em um
 * ano, e o tempo de resposta do bot degrada junto — que é exatamente o que o
 * produto promete não fazer.
 *
 * O TTL em `conversations` também resolve o crescimento sem fim: a sessão já é
 * zerada logicamente a cada 24h, então guardar o documento por mais de 60 dias
 * não serve para nada além de ocupar disco.
 */

const DIAS = 24 * 60 * 60;

const INDICES = [
  ['clients', { clientId: 1 }, { unique: true, name: 'clientId_unico' }],
  ['clients', { ativo: 1 }, { name: 'ativo' }],

  ['conversations', { key: 1 }, { unique: true, name: 'key_unico' }],
  ['conversations', { updatedAt: 1 }, { expireAfterSeconds: 60 * DIAS, name: 'ttl_60_dias' }],

  ['leads', { clientId: 1, criadoEm: -1 }, { name: 'cliente_recentes' }],
  ['leads', { clientId: 1, status: 1, criadoEm: 1 }, { name: 'pendentes_para_alerta' }],

  ['stats', { clientId: 1, data: 1 }, { unique: true, name: 'cliente_dia' }],
  ['stats', { data: -1 }, { name: 'por_data' }],

  ['usoMensal', { clientId: 1, mes: 1 }, { unique: true, name: 'cliente_mes' }],
  ['faturasAdicionais', { clientId: 1, mes: 1 }, { unique: true, name: 'fatura_cliente_mes' }],
  ['faturasAdicionais', { cobrado: 1 }, { name: 'pendentes' }]
];

async function criarIndices(db) {
  let criados = 0;
  for (const [colecao, chaves, opcoes] of INDICES) {
    try {
      await db.collection(colecao).createIndex(chaves, opcoes);
      criados++;
    } catch (err) {
      // Índice único sobre dados legados duplicados: avisa, não derruba o boot.
      console.warn(`[ÍNDICE] ${colecao}.${opcoes.name}: ${err.message}`);
    }
  }
  console.log(`✅ ${criados}/${INDICES.length} índices garantidos`);
}

module.exports = { criarIndices, INDICES };
