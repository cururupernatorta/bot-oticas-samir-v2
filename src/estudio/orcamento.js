const { SERVICOS, URGENCIA, COMPLEXIDADE, getServico, contarLaudas } = require('./config');
const { analisar } = require('./analisador');

/**
 * ORÇAMENTO — transforma "quanto custa?" em número, em segundos.
 *
 * A velocidade de resposta é vantagem competitiva real: quem responde
 * orçamento em 2 minutos ganha do que responde em 6 horas, mesmo cobrando
 * mais caro. Todo o cálculo aqui é determinístico — nada de pedir preço
 * para um LLM, que devolve valor diferente a cada pergunta.
 */

function arredondar(valor) {
  // Preço quebrado parece calculado no chute. Arredonda para dezena.
  return Math.max(0, Math.round(valor / 10) * 10);
}

/**
 * Orça um trabalho a partir do texto e das opções.
 * Devolve preço, prazo e a memória de cálculo — o cliente que vê a conta confia mais.
 */
function orcar({ texto, servico = 'revisao', urgencia = 'normal', complexidade = 'simples', peca = 'anuncio', faixa = 'Básico' }) {
  const s = getServico(servico);
  if (!s) throw new Error(`serviço desconhecido: ${servico}`);

  const u = URGENCIA[urgencia] || URGENCIA.normal;
  const c = COMPLEXIDADE[complexidade] || COMPLEXIDADE.simples;
  const memoria = [];

  let base = 0;
  let unidades = null;

  if (s.modelo === 'fixo') {
    base = s.preco;
    memoria.push(`${s.nome}: R$ ${base} (valor fixo)`);

  } else if (s.modelo === 'lauda') {
    if (!texto) throw new Error('serviço por lauda exige o texto para contar');
    unidades = contarLaudas(texto);
    base = unidades * s.precoPorLauda;
    memoria.push(`${unidades} lauda(s) × R$ ${s.precoPorLauda} = R$ ${base}`);
    if (base < s.minimo) {
      memoria.push(`abaixo do mínimo de R$ ${s.minimo} — aplicado o mínimo`);
      base = s.minimo;
    }

  } else if (s.modelo === 'peca') {
    base = s.precoPorPeca[peca];
    if (base == null) throw new Error(`tipo de peça desconhecido: ${peca}`);
    memoria.push(`${s.nome} (${peca}): R$ ${base}`);

  } else if (s.modelo === 'mensal') {
    const f = s.faixas.find(x => x.nome.toLowerCase() === String(faixa).toLowerCase());
    if (!f) throw new Error(`faixa desconhecida: ${faixa}`);
    return {
      servico: s.nome,
      faixa: f.nome,
      preco: f.preco,
      laudasInclusas: f.laudas,
      prazoHoras: f.prazoHoras,
      memoria: [`Retainer ${f.nome}: R$ ${f.preco}/mês por até ${f.laudas} laudas`],
      recorrente: true
    };
  }

  if (c.fator !== 1) {
    const antes = base;
    base *= c.fator;
    memoria.push(`complexidade (${c.rotulo}): ×${c.fator} → R$ ${Math.round(base)} (de R$ ${Math.round(antes)})`);
  }

  if (u.fator !== 1) {
    const antes = base;
    base *= u.fator;
    memoria.push(`urgência (${u.rotulo}): ×${u.fator} → R$ ${Math.round(base)} (de R$ ${Math.round(antes)})`);
  }

  const prazoHoras = Math.max(2, Math.round(s.prazoHoras / u.fator));

  return {
    servico: s.nome,
    servicoId: servico,
    preco: arredondar(base),
    unidades,
    prazoHoras,
    prazoTexto: prazoHoras <= 12 ? `${prazoHoras} horas`
              : prazoHoras <= 24 ? 'até 24 horas'
              : `${Math.round(prazoHoras / 24)} dia(s) útil(eis)`,
    entrega: s.entrega,
    memoria,
    recorrente: false
  };
}

/**
 * Recomenda o serviço certo lendo o texto.
 *
 * Se o texto tem cheiro de IA alto, revisão gramatical não resolve — o
 * problema não é vírgula, é ritmo. Vender revisão nesse caso gera cliente
 * insatisfeito, que é mais caro que cliente perdido.
 */
function recomendar(texto) {
  const a = analisar(texto);
  const laudas = contarLaudas(texto);

  let sugerido, motivo;
  if (a.score >= 55) {
    sugerido = 'humanizacao';
    motivo = `O texto pontuou ${a.score}/100 em cheiro de IA. Correção gramatical não resolveria: o problema é ritmo e vocabulário, não ortografia.`;
  } else if (a.score >= 30) {
    sugerido = 'revisao';
    motivo = `O texto pontuou ${a.score}/100. Está próximo do natural — revisão de estilo já resolve.`;
  } else {
    sugerido = 'revisao';
    motivo = `O texto pontuou ${a.score}/100 e já lê bem. Revisão aqui é acabamento, não conserto.`;
  }

  return {
    analise: a,
    laudas,
    servicoSugerido: sugerido,
    motivo,
    orcamento: orcar({ texto, servico: sugerido }),
    alternativa: sugerido === 'humanizacao'
      ? orcar({ texto, servico: 'diagnostico' })
      : null
  };
}

module.exports = { orcar, recomendar, arredondar };
