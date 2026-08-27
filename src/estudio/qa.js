const { analisar, palavras, dividirParagrafos } = require('./analisador');
const { comparar, estatisticas } = require('./diff');

/**
 * PORTÃO DE QUALIDADE — o que impede a entrega de dar errado.
 *
 * Estas checagens existem porque são exatamente as reclamações que
 * derrubam avaliação de freelancer: "mudou o sentido", "inventou dado",
 * "veio com metade do tamanho", "tirou minha chamada para ação".
 *
 * Tudo aqui é determinístico. O modelo não audita a si mesmo.
 */

/** Números presentes no texto — o vetor mais comum de invenção. */
function extrairNumeros(texto) {
  return (texto.match(/\d+(?:[.,]\d+)*\s*%?/g) || []).map(n => n.trim());
}

/** URLs, e-mails e @perfis não podem mudar nunca. */
function extrairIdentificadores(texto) {
  return [
    ...(texto.match(/https?:\/\/[^\s)]+/gi) || []),
    ...(texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []),
    ...(texto.match(/@[A-Za-z0-9._]{3,}/g) || [])
  ];
}

function normalizarNumero(n) {
  return n.replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '');
}

/**
 * Roda todas as checagens. Devolve { aprovado, alertas, checagens }.
 * Nunca lança: um erro de QA não pode derrubar a entrega, só sinalizar.
 */
function verificar(original, revisado, { toleranciaTamanho = 0.30 } = {}) {
  const alertas = [];
  const checagens = [];

  const wsO = palavras(original);
  const wsR = palavras(revisado);

  // 1. Texto vazio ou truncado
  if (!revisado || !revisado.trim()) {
    return {
      aprovado: false,
      alertas: [{ nivel: 'bloqueio', mensagem: 'O texto revisado veio vazio.' }],
      checagens: []
    };
  }

  // 2. Tamanho — encolhimento grande costuma ser truncamento do modelo
  const razao = wsR.length / Math.max(1, wsO.length);
  const desvio = Math.abs(1 - razao);
  const okTamanho = desvio <= toleranciaTamanho;
  checagens.push({
    nome: 'Comprimento preservado',
    passou: okTamanho,
    detalhe: `${wsO.length} → ${wsR.length} palavras (${razao >= 1 ? '+' : ''}${Math.round((razao - 1) * 100)}%)`
  });
  if (!okTamanho) {
    alertas.push({
      nivel: razao < 0.5 ? 'bloqueio' : 'atenção',
      mensagem: razao < 1
        ? `O texto encolheu ${Math.round((1 - razao) * 100)}%. Pode ter sido truncado.`
        : `O texto cresceu ${Math.round((razao - 1) * 100)}%. Pode ter conteúdo inventado.`
    });
  }

  // 3. Números — nenhum pode aparecer do nada
  const numO = new Set(extrairNumeros(original).map(normalizarNumero));
  const numR = extrairNumeros(revisado).map(normalizarNumero);
  const inventados = numR.filter(n => !numO.has(n));
  const perdidos = [...numO].filter(n => !numR.includes(n));

  checagens.push({
    nome: 'Números conferem',
    passou: inventados.length === 0,
    detalhe: inventados.length === 0
      ? `${numO.size} número(s) no original, todos preservados`
      : `apareceram do nada: ${inventados.join(', ')}`
  });
  if (inventados.length) {
    alertas.push({ nivel: 'bloqueio', mensagem: `Números que não estavam no original: ${inventados.join(', ')}. Confira antes de entregar.` });
  }
  if (perdidos.length) {
    alertas.push({ nivel: 'atenção', mensagem: `Números do original que sumiram: ${perdidos.join(', ')}.` });
  }

  // 4. Links, e-mails e perfis
  const idO = extrairIdentificadores(original);
  const idR = extrairIdentificadores(revisado);
  const idPerdidos = idO.filter(i => !idR.includes(i));
  checagens.push({
    nome: 'Links e contatos intactos',
    passou: idPerdidos.length === 0,
    detalhe: idO.length === 0 ? 'nenhum no original' : `${idO.length} encontrado(s), ${idPerdidos.length} perdido(s)`
  });
  if (idPerdidos.length) {
    alertas.push({ nivel: 'bloqueio', mensagem: `Link/contato removido ou alterado: ${idPerdidos.join(', ')}.` });
  }

  // 5. Estrutura de parágrafos
  const pO = dividirParagrafos(original).length;
  const pR = dividirParagrafos(revisado).length;
  const okEstrutura = Math.abs(pO - pR) <= Math.max(1, Math.floor(pO * 0.34));
  checagens.push({
    nome: 'Estrutura preservada',
    passou: okEstrutura,
    detalhe: `${pO} → ${pR} parágrafos`
  });
  if (!okEstrutura) {
    alertas.push({ nivel: 'atenção', mensagem: `A quantidade de parágrafos mudou de ${pO} para ${pR}.` });
  }

  // 6. O trabalho foi realmente feito?
  const st = estatisticas(comparar(original, revisado));
  const mudouAlgo = st.percentualAlterado >= 3;
  checagens.push({
    nome: 'Revisão efetiva',
    passou: mudouAlgo,
    detalhe: `${st.percentualAlterado}% do texto alterado`
  });
  if (!mudouAlgo) {
    alertas.push({ nivel: 'atenção', mensagem: 'Quase nada mudou. Confira se valia cobrar por esta revisão.' });
  }

  // 7. O texto de fato melhorou?
  const aO = analisar(original);
  const aR = analisar(revisado);
  const melhorou = aR.score < aO.score;
  checagens.push({
    nome: 'Naturalidade melhorou',
    passou: melhorou,
    detalhe: `score ${aO.score} → ${aR.score}`
  });
  if (!melhorou) {
    alertas.push({ nivel: 'atenção', mensagem: `O score não melhorou (${aO.score} → ${aR.score}). Não entregue sem olhar.` });
  }

  const bloqueios = alertas.filter(a => a.nivel === 'bloqueio');

  return {
    aprovado: bloqueios.length === 0,
    bloqueios: bloqueios.length,
    alertas,
    checagens,
    scoreAntes: aO.score,
    scoreDepois: aR.score,
    percentualAlterado: st.percentualAlterado
  };
}

module.exports = { verificar, extrairNumeros, extrairIdentificadores };
