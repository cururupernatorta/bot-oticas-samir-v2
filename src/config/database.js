const { MongoClient } = require('mongodb');
const { criarIndices } = require('./indices');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
let db = null;

async function connectDB() {
  if (db) return db;
  try {
    // maxPoolSize dimensionado para ~10 clientes num servidor: as chamadas de
    // IA levam segundos, então o que importa é concorrência de I/O, não CPU.
    const client = new MongoClient(uri, {
      maxPoolSize: parseInt(process.env.MONGO_POOL || '50', 10),
      minPoolSize: 5,
      serverSelectionTimeoutMS: 8000
    });
    await client.connect();
    db = client.db('botsaas');
    console.log('✅ MongoDB conectado');
    await criarIndices(db);
    return db;
  } catch (err) {
    console.error('❌ MongoDB:', err.message);
    process.exit(1);
  }
}

function getDB() {
  if (!db) throw new Error('DB não conectado');
  return db;
}

module.exports = { connectDB, getDB };
