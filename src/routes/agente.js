const express = require('express');
const router = express.Router();
const { AGENTE } = require('../agente/config');
const { rodarCiclo } = require('../agente/loop');
const { aprovarEEnviar, rejeitar, despacharFila } = require('../agente/outreach');
const { registrarOptOut } = require('../agente/compliance');
const { filaAprovacao, listarProspects, contarPorStatus } = require('../models/Prospect');
const { getDB } = require('../config/database');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function auth(req, res, next) {
  const pass = req.query.password || req.body.password || req.headers.authorization?.replace('Bearer ', '');
  if (pass === ADMIN_PASSWORD) return next();
  return res.status(401).json({ error: 'Não autorizado' });
}

/** Painel de controle do agente: o que ele fez e o que espera aprovação. */
router.get('/status', auth, async (req, res) => {
  try {
    const [funil, fila] = await Promise.all([contarPorStatus(), filaAprovacao(100)]);
    const auditoria = await getDB().collection('agente_auditoria')
      .find({ acao: 'ciclo' }).sort({ em: -1 }).limit(5).toArray();

    res.json({
      modo: AGENTE.modo,
      ativo: AGENTE.ativo,
      cidades: AGENTE.cidades,
      limites: AGENTE.limites,
      funil,
      aguardandoAprovacao: fila.length,
      ultimosCiclos: auditoria
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** Fila de aprovação — o que o agente escreveu e quer enviar. */
router.get('/fila', auth, async (req, res) => {
  try {
    const fila = await filaAprovacao(parseInt(req.query.limite || '50'));
    res.json(fila.map(p => ({
      chaveUnica: p.chaveUnica,
      nome: p.nome,
      nicho: p.nicho,
      cidade: p.cidade,
      telefone: p.telefone,
      score: p.score,
      motivoScore: p.motivoScore,
      gancho: p.gancho,
      etapa: p.etapaPendente,
      tipo: p.tipoPendente,
      mensagem: p.mensagemPendente
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/aprovar/:chave(*)', auth, async (req, res) => {
  try { res.json(await aprovarEEnviar(req.params.chave)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rejeitar/:chave(*)', auth, async (req, res) => {
  try { res.json(await rejeitar(req.params.chave, req.body?.motivo)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

/** Aprova a fila inteira. Use com cuidado — respeita os limites do compliance. */
router.post('/aprovar-lote', auth, async (req, res) => {
  try { res.json(await despacharFila({ limite: parseInt(req.body?.limite || '10'), forcar: true })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

/** Dispara um ciclo manualmente, sem esperar o cron. */
router.post('/ciclo', auth, async (req, res) => {
  try { res.json(await rodarCiclo({ pularProspeccao: req.body?.pularProspeccao === true })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/prospects', auth, async (req, res) => {
  try {
    const filtro = {};
    if (req.query.status) filtro.status = req.query.status;
    if (req.query.nicho) filtro.nicho = req.query.nicho;
    res.json(await listarProspects(filtro, parseInt(req.query.limite || '100')));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** Opt-out manual — alguém pediu por outro canal (telefone, e-mail, pessoalmente). */
router.post('/optout', auth, async (req, res) => {
  try {
    if (!req.body?.telefone) return res.status(400).json({ error: 'telefone obrigatório' });
    await registrarOptOut(req.body.telefone, req.body.origem || 'manual');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** Trilha de auditoria — o registro do que o agente fez, para a LGPD e para você. */
router.get('/auditoria', auth, async (req, res) => {
  try {
    const filtro = req.query.acao ? { acao: req.query.acao } : {};
    const linhas = await getDB().collection('agente_auditoria')
      .find(filtro).sort({ em: -1 }).limit(parseInt(req.query.limite || '100')).toArray();
    res.json(linhas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
