require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const { iniciarCronJobs } = require('./services/relatorioService');
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const agenteRoutes = require('./routes/agente');
const { iniciarAgente } = require('./agente/loop');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Bot SaaS v3 (Claude Edition)', version: '3.1.0', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/webhook', webhookRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agente', agenteRoutes);

async function start() {
  await connectDB();
  iniciarCronJobs();
  iniciarAgente();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor na porta ${PORT}`);
    console.log(`📊 Painel: http://localhost:${PORT}/admin`);
    console.log(`💓 Health: http://localhost:${PORT}/health`);
  });
}

start();
