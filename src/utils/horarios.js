/**
 * MOTOR DE HORÁRIOS — multi-tenant, multi-fuso, sem nada hardcoded.
 *
 * Antes (v3.1) o horário de cada loja era decidido por `if (nome.includes('toledo'))`,
 * o que amarrava o produto a um único cliente. Agora o horário vem SEMPRE dos dados.
 *
 * Fontes aceitas, em ordem de prioridade:
 *  1. unidade.horarios        → { seg: [{inicio:'08:30', fim:'18:30'}], dom: null, ... }
 *  2. unidade.horarioComercial→ { segSex:{inicio,fim}, sabado:{...}, domingo:null }
 *  3. cliente.horarioComercial→ mesmo formato, vale como padrão da empresa
 *  4. PADRAO                  → Seg-Sex 08:00-18:00 | Sáb 08:00-12:00 | Dom fechado
 *
 * Suporta múltiplas faixas por dia (ex.: almoço fechado 12h-14h).
 */

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DIAS_LONGO = {
  dom: 'domingo', seg: 'segunda-feira', ter: 'terça-feira', qua: 'quarta-feira',
  qui: 'quinta-feira', sex: 'sexta-feira', sab: 'sábado'
};
const DIAS_CURTO = { dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb' };
const FUSO_PADRAO = 'America/Sao_Paulo';

const PADRAO = {
  seg: [{ inicio: '08:00', fim: '18:00' }],
  ter: [{ inicio: '08:00', fim: '18:00' }],
  qua: [{ inicio: '08:00', fim: '18:00' }],
  qui: [{ inicio: '08:00', fim: '18:00' }],
  sex: [{ inicio: '08:00', fim: '18:00' }],
  sab: [{ inicio: '08:00', fim: '12:00' }],
  dom: []
};

function paraMinutos(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const m = hhmm.trim().match(/^(\d{1,2})[:h.]?(\d{2})?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (isNaN(h) || isNaN(min) || h > 24 || min > 59) return null;
  return h * 60 + min;
}

function paraHHMM(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Momento atual no fuso do cliente: { dia: 0-6, minutos: 0-1439 } */
function agoraNoFuso(fuso = FUSO_PADRAO) {
  let partes;
  try {
    partes = new Intl.DateTimeFormat('en-US', {
      timeZone: fuso, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
  } catch (err) {
    partes = new Intl.DateTimeFormat('en-US', {
      timeZone: FUSO_PADRAO, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
  }
  const get = t => partes.find(p => p.type === t)?.value;
  const mapa = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    dia: mapa[get('weekday')] ?? 1,
    minutos: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10)
  };
}

function faixasDeUmDia(valor) {
  if (!valor) return [];
  const lista = Array.isArray(valor) ? valor : [valor];
  return lista
    .map(f => ({ inicio: paraMinutos(f.inicio), fim: paraMinutos(f.fim) }))
    .filter(f => f.inicio !== null && f.fim !== null && f.fim > f.inicio);
}

/** Converte o formato { segSex, sabado, domingo } no formato por dia da semana. */
function expandirComercial(hc) {
  if (!hc) return null;
  const semana = faixasDeUmDia(hc.segSex);
  const sab = faixasDeUmDia(hc.sabado);
  const dom = faixasDeUmDia(hc.domingo);
  if (!semana.length && !sab.length && !dom.length) return null;
  return { seg: semana, ter: semana, qua: semana, qui: semana, sex: semana, sab, dom };
}

/** Grade de horários efetiva da unidade, já normalizada. */
function gradeDaUnidade(unidade = {}, cliente = {}) {
  // `horarios` na unidade é autoritativo: um dia declarado como [] significa
  // FECHADO, e não "herde o horário da empresa".
  if (unidade.horarios && typeof unidade.horarios === 'object'
      && DIAS.some(d => unidade.horarios[d] !== undefined)) {
    const grade = {};
    for (const d of DIAS) grade[d] = faixasDeUmDia(unidade.horarios[d]);
    return grade;
  }
  return expandirComercial(unidade.horarioComercial)
    || expandirComercial(cliente.horarioComercial)
    || gradePadrao();
}

let _padraoCache = null;
function gradePadrao() {
  if (!_padraoCache) {
    _padraoCache = {};
    for (const d of DIAS) _padraoCache[d] = faixasDeUmDia(PADRAO[d]);
  }
  return _padraoCache;
}

function estaAberta(unidade = {}, cliente = {}) {
  if (unidade.sempreAberta || cliente.sempreAberto) return true;
  const grade = gradeDaUnidade(unidade, cliente);
  const { dia, minutos } = agoraNoFuso(cliente.fusoHorario || FUSO_PADRAO);
  return (grade[DIAS[dia]] || []).some(f => minutos >= f.inicio && minutos < f.fim);
}

/** "Seg a Sex 08:30–18:30 | Sáb 08:30–13:00 | Dom fechado" */
function descreverHorario(unidade = {}, cliente = {}) {
  if (unidade.sempreAberta || cliente.sempreAberto) return 'Aberto 24 horas, todos os dias';
  const grade = gradeDaUnidade(unidade, cliente);

  const assinatura = d => (grade[d] || []).map(f => `${paraHHMM(f.inicio)}–${paraHHMM(f.fim)}`).join(' e ') || 'fechado';
  const blocos = [];
  let atual = null;

  for (const d of ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']) {
    const sig = assinatura(d);
    if (atual && atual.sig === sig) atual.dias.push(d);
    else { atual = { sig, dias: [d] }; blocos.push(atual); }
  }

  return blocos.map(b => {
    const rotulo = b.dias.length === 1
      ? DIAS_CURTO[b.dias[0]]
      : b.dias.length === 2
        ? `${DIAS_CURTO[b.dias[0]]} e ${DIAS_CURTO[b.dias[1]]}`
        : `${DIAS_CURTO[b.dias[0]]} a ${DIAS_CURTO[b.dias[b.dias.length - 1]]}`;
    return b.sig === 'fechado' ? `${rotulo} fechado` : `${rotulo} ${b.sig}`;
  }).join(' | ');
}

/** "hoje às 14:00", "amanhã às 08:30" ou "na segunda-feira às 09:00" */
function proximaAbertura(unidade = {}, cliente = {}) {
  if (unidade.sempreAberta || cliente.sempreAberto) return 'agora (atendemos 24h)';
  const grade = gradeDaUnidade(unidade, cliente);
  const { dia, minutos } = agoraNoFuso(cliente.fusoHorario || FUSO_PADRAO);

  for (let salto = 0; salto < 8; salto++) {
    const d = (dia + salto) % 7;
    const faixas = (grade[DIAS[d]] || []).slice().sort((a, b) => a.inicio - b.inicio);
    for (const f of faixas) {
      if (salto === 0 && f.inicio <= minutos) continue;
      const quando = salto === 0 ? 'hoje' : salto === 1 ? 'amanhã' : `na ${DIAS_LONGO[DIAS[d]]}`;
      return `${quando} às ${paraHHMM(f.inicio)}`;
    }
  }
  return 'em breve';
}

function unidadesAbertas(unidades = {}, cliente = {}) {
  return Object.keys(unidades)
    .filter(k => estaAberta(unidades[k], cliente))
    .map(k => ({ key: k, ...unidades[k] }));
}

function unidadeAleatoria(unidades = {}) {
  const keys = Object.keys(unidades || {});
  if (!keys.length) return null;
  const k = keys[Math.floor(Math.random() * keys.length)];
  return { key: k, ...unidades[k] };
}

/** Usado no onboarding: transforma "8:30-18:30" digitado no formulário em faixas. */
function parseFaixa(texto) {
  if (!texto) return [];
  return String(texto).split(/\s*(?:,|e|\/)\s*/i)
    .map(p => {
      const m = p.match(/(\d{1,2}[:h.]?\d{0,2})\s*(?:as|às|à|-|–|ate|até)\s*(\d{1,2}[:h.]?\d{0,2})/i);
      if (!m) return null;
      const inicio = paraMinutos(m[1].replace(/h$/i, ':00'));
      const fim = paraMinutos(m[2].replace(/h$/i, ':00'));
      return inicio !== null && fim !== null && fim > inicio ? { inicio: paraHHMM(inicio), fim: paraHHMM(fim) } : null;
    })
    .filter(Boolean);
}

module.exports = {
  DIAS, DIAS_LONGO, DIAS_CURTO, FUSO_PADRAO, PADRAO,
  agoraNoFuso, gradeDaUnidade, estaAberta, descreverHorario,
  proximaAbertura, unidadesAbertas, unidadeAleatoria, parseFaixa,
  paraMinutos, paraHHMM
};
