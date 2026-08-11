const axios = require('axios');

async function enviarWhatsApp(instanceId, token, phone, message) {
  if (!message || !message.trim()) return;
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
  try {
    await axios.post(url, { phone, message }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    console.log(`[Z-API] Texto → ${phone}`);
  } catch (err) {
    console.error(`[Z-API ERRO] ${phone}:`, err.response?.data?.message || err.message);
  }
}

async function enviarBotao(instanceId, token, phone, message, buttons) {
  if (!buttons || buttons.length === 0) return enviarWhatsApp(instanceId, token, phone, message);
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-button-list`;
  try {
    await axios.post(url, {
      phone,
      message,
      buttonList: { title: 'Ações', buttons: buttons.map(b => ({ id: b.id, label: b.label })) }
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    console.log(`[Z-API] Botão → ${phone}`);
  } catch (err) {
    console.error(`[Z-API BOTÃO ERRO] ${phone}:`, err.response?.data?.message || err.message);
    await enviarWhatsApp(instanceId, token, phone, message);
  }
}

module.exports = { enviarWhatsApp, enviarBotao };
