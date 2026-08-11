const express = require('express');
const router = express.Router();
const { getClientById } = require('../models/Client');
const { processarMensagem, processarBotao } = require('../services/botService');

router.post('/:clientId', async (req, res) => {
  const { clientId } = req.params;
  try {
    const cliente = await getClientById(clientId);
    if (!cliente) {
      console.warn(`[WEBHOOK] Cliente não encontrado: ${clientId}`);
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    if (req.body.buttonId) {
      processarBotao(cliente, req.body).catch(err => console.error('[BOTÃO ERRO]:', err.message));
      return res.status(200).json({ received: true });
    }

    processarMensagem(cliente, req.body).catch(err => {
      console.error(`[WEBHOOK ERRO] ${clientId}:`, err.message);
    });

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[WEBHOOK ERRO]:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
