const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
let db = null;

async function connectDB() {
  if (db) return db;
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('botsaas');
    console.log('✅ MongoDB conectado');
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
