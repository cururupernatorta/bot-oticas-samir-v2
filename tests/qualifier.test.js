/**
 * Testes do qualifier — só a parte determinística (score + horários).
 * O gancho depende do Claude e é testado em integração, não aqui.
 */
const assert = require('assert');
const { calcularScore, horasDescobertas } = require('../src/agente/qualifier');

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

const base = {
  nome: 'Teste', nicho: 'otica', cidade: 'Belém',
  telefone: '5591987654321', temWhatsappDeclarado: false,
  site: null, endereco: null, horarioPublicado: null
};

// ── horasDescobertas ────────────────────────────────────────────────
teste('24/7 não tem hora descoberta', () => {
  assert.strictEqual(horasDescobertas('24/7'), 0);
});
teste('horário nulo retorna null (sinal ausente, não zero)', () => {
  assert.strictEqual(horasDescobertas(null), null);
});
teste('comércio 9h-18h deixa a maior parte da semana descoberta', () => {
  const h = horasDescobertas('Mo-Fr 09:00-18:00');
  assert.ok(h > 100, 'esperado >100h descobertas, veio ' + h);
});
teste('texto sem faixa de horário retorna null', () => {
  assert.strictEqual(horasDescobertas('by appointment'), null);
});
teste('nunca retorna negativo', () => {
  const h = horasDescobertas('Mo-Su 00:00-23:59');
  assert.ok(h >= 0, 'não pode ser negativo, veio ' + h);
});

// ── calcularScore ───────────────────────────────────────────────────
teste('score fica sempre entre 0 e 100', () => {
  const cheio = { ...base, nicho: 'odonto', temWhatsappDeclarado: true,
    site: null, endereco: 'Rua X, 1', horarioPublicado: 'Mo-Fr 09:00-18:00' };
  const { score } = calcularScore(cheio);
  assert.ok(score >= 0 && score <= 100, 'score fora da faixa: ' + score);
});

teste('whatsapp declarado aumenta o score', () => {
  const sem = calcularScore({ ...base, temWhatsappDeclarado: false, telefone: '5591987654321' });
  const com = calcularScore({ ...base, temWhatsappDeclarado: true,  telefone: '5591987654321' });
  assert.ok(com.score > sem.score, 'whatsapp deveria somar');
});

teste('telefone fixo sem whatsapp derruba o score', () => {
  const fixo = calcularScore({ ...base, telefone: '559132345678' });   // 12 díg = fixo
  const cel  = calcularScore({ ...base, telefone: '5591987654321' });  // 13 díg = celular
  assert.ok(fixo.score < cel.score, 'fixo deveria pontuar menos');
});

teste('odonto e clínica pontuam acima de autoescola', () => {
  const odonto = calcularScore({ ...base, nicho: 'odonto' });
  const auto   = calcularScore({ ...base, nicho: 'autoescola' });
  assert.ok(odonto.score > auto.score, 'fit de nicho não foi aplicado');
});

teste('nicho desconhecido cai no default sem quebrar', () => {
  const { score } = calcularScore({ ...base, nicho: 'nicho_que_nao_existe' });
  assert.ok(typeof score === 'number' && score > 0, 'deveria ter score default');
});

teste('sempre devolve sinais explicando a nota', () => {
  const { sinais } = calcularScore(base);
  assert.ok(Array.isArray(sinais) && sinais.length > 0, 'score sem motivo é adivinhação');
});

teste('horário limitado soma pontos de dor', () => {
  const sem = calcularScore({ ...base, horarioPublicado: null });
  const com = calcularScore({ ...base, horarioPublicado: 'Mo-Fr 09:00-18:00' });
  assert.ok(com.score > sem.score, 'horário curto deveria aumentar a dor');
});

teste('empresa 24/7 não ganha pontos de horário descoberto', () => {
  const full = calcularScore({ ...base, horarioPublicado: '24/7' });
  const curto = calcularScore({ ...base, horarioPublicado: 'Mo-Fr 09:00-18:00' });
  assert.ok(curto.score > full.score, '24/7 não deveria pontuar como dor');
});

let ok = 0, falhas = 0;
for (const t of testes) {
  try { t.fn(); console.log('  ✓ ' + t.nome); ok++; }
  catch (err) { console.log('  ✗ ' + t.nome + '\n      ' + err.message); falhas++; }
}
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam');
process.exit(falhas > 0 ? 1 : 0);
