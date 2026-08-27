/**
 * CONFIG DO AGENTE DE AQUISIÇÃO
 *
 * Fonte única de verdade do comportamento autônomo.
 * Tudo aqui é sobrevivência operacional: os limites existem para o agente
 * não queimar o número do WhatsApp nem violar a LGPD rodando sozinho.
 */

const AGENTE = {
  // ── Modo de operação ──────────────────────────────────────────────
  // 'manual'  → agente pesquisa, qualifica e ESCREVE, mas você aprova o envio
  // 'auto'    → agente envia sozinho (só ligue depois de ~50 aprovações manuais)
  modo: process.env.AGENTE_MODO || 'manual',

  // Liga/desliga o ciclo automático (cron). Sem isso, só roda via CLI.
  ativo: process.env.AGENTE_ATIVO === 'true',

  // ── Alvo de prospecção ────────────────────────────────────────────
  // Nichos ordenados por fit com o produto (bot de atendimento 24h).
  // Critério: volume alto de mensagens + ticket que paga R$ 900/mês.
  nichos: [
    { id: 'otica',        osm: 'shop=optician',                    label: 'Óticas' },
    { id: 'clinica',      osm: 'amenity=clinic',                   label: 'Clínicas' },
    { id: 'odonto',       osm: 'amenity=dentist',                  label: 'Clínicas odontológicas' },
    { id: 'petshop',      osm: 'shop=pet',                         label: 'Pet shops' },
    { id: 'academia',     osm: 'leisure=fitness_centre',           label: 'Academias' },
    { id: 'imobiliaria',  osm: 'office=estate_agent',              label: 'Imobiliárias' },
    { id: 'autoescola',   osm: 'amenity=driving_school',           label: 'Autoescolas' },
    { id: 'estetica',     osm: 'shop=beauty',                      label: 'Clínicas de estética' }
  ],

  cidades: (process.env.AGENTE_CIDADES || 'Belém,Ananindeua,Marituba')
    .split(',').map(c => c.trim()).filter(Boolean),

  // ── Limites de segurança (anti-ban e anti-multa) ──────────────────
  limites: {
    prospeccoesPorCiclo: parseInt(process.env.AGENTE_MAX_PROSPECCAO || '40'),
    qualificacoesPorCiclo: parseInt(process.env.AGENTE_MAX_QUALIFICACAO || '15'),
    enviosPorDia: parseInt(process.env.AGENTE_MAX_ENVIOS_DIA || '20'),
    enviosPorHora: parseInt(process.env.AGENTE_MAX_ENVIOS_HORA || '5'),
    intervaloMinEntreEnviosMs: parseInt(process.env.AGENTE_INTERVALO_MS || '90000'),
    scoreMinimoParaAbordar: parseInt(process.env.AGENTE_SCORE_MINIMO || '65')
  },

  // ── Janela de contato (LGPD + bom senso comercial) ────────────────
  // Nunca fora disso. Mensagem comercial 22h = denúncia certa.
  janelaContato: {
    diasSemana: [1, 2, 3, 4, 5],   // seg–sex
    horaInicio: 9,
    horaFim: 18,
    timezone: 'America/Sao_Paulo'
  },

  // ── Cadência de follow-up ─────────────────────────────────────────
  // Para IMEDIATAMENTE se o prospect responder ou pedir descadastro.
  cadencia: [
    { etapa: 1, aposDias: 0,  tipo: 'diagnostico' },
    { etapa: 2, aposDias: 3,  tipo: 'prova_social' },
    { etapa: 3, aposDias: 7,  tipo: 'oferta_teste' },
    { etapa: 4, aposDias: 14, tipo: 'encerramento' }
  ],
  maxToques: 4,

  // ── Identidade comercial (usada nas mensagens) ────────────────────
  vendedor: {
    nome: process.env.AGENTE_VENDEDOR_NOME || 'Samir',
    empresa: process.env.AGENTE_EMPRESA || 'Atendimento 24h',
    whatsappResposta: process.env.AGENTE_WHATSAPP_RESPOSTA || '',
    site: process.env.AGENTE_SITE || ''
  },

  // Instância Z-API usada para prospecção (SEPARADA das instâncias de cliente).
  // Nunca prospecte pelo número que atende clientes pagantes.
  zapi: {
    instanceId: process.env.AGENTE_ZAPI_INSTANCE || '',
    token: process.env.AGENTE_ZAPI_TOKEN || ''
  }
};

function getNicho(id) {
  return AGENTE.nichos.find(n => n.id === id) || AGENTE.nichos[0];
}

module.exports = { AGENTE, getNicho };
