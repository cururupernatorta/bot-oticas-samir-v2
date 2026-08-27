/**
 * DIFF — marcação de alterações palavra a palavra.
 *
 * Revisão sem diff é fé. O cliente manda um texto, recebe outro, e não
 * tem como saber se você trabalhou ou só rodou corretor ortográfico.
 * O diff é a prova do serviço, e é o que o Word chama de "controlar
 * alterações" — o formato que todo cliente de revisão já espera.
 *
 * Implementação: LCS clássico sobre tokens. Sem dependência externa —
 * o repositório tem 5 pacotes e não vale um sexto por 60 linhas.
 */

/**
 * Tokeniza em três classes: espaço, palavra e pontuação.
 *
 * A pontuação precisa ser token separado. Se ela ficar colada na palavra,
 * "óculos." e "óculos" viram tokens diferentes e o diff acusa uma
 * substituição onde só houve inserção depois da palavra — poluindo
 * exatamente o relatório que o cliente vai ler.
 *
 * Hífen e apóstrofo internos ficam na palavra: "guarda-chuva" é uma
 * palavra só, não três tokens.
 */
function tokenizar(texto) {
  return texto.match(/\s+|[\p{L}\p{N}]+(?:[''\u2019-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]+/gu) || [];
}

function ehEspaco(token) {
  return /^\s+$/.test(token);
}

/**
 * Maior subsequência comum. Devolve a matriz de comprimentos.
 * O(n×m) em memória — aceitável para textos de revisão (até ~20 mil palavras).
 */
function matrizLCS(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp;
}

/**
 * Compara original e revisado. Devolve lista de operações:
 *   { tipo: 'igual' | 'removido' | 'inserido', texto }
 */
function comparar(original, revisado) {
  const a = tokenizar(original);
  const b = tokenizar(revisado);
  const dp = matrizLCS(a, b);

  const ops = [];
  let i = 0, j = 0;

  const empurrar = (tipo, texto) => {
    const ultimo = ops[ops.length - 1];
    if (ultimo && ultimo.tipo === tipo) ultimo.texto += texto;
    else ops.push({ tipo, texto });
  };

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { empurrar('igual', a[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { empurrar('removido', a[i]); i++; }
    else { empurrar('inserido', b[j]); j++; }
  }
  while (i < a.length) { empurrar('removido', a[i]); i++; }
  while (j < b.length) { empurrar('inserido', b[j]); j++; }

  return ops;
}

/**
 * Funde regiões de mudança separadas por poucas palavras iguais.
 *
 * Por que isso existe: o LCS é matematicamente correto mas visualmente
 * inútil em texto muito reescrito. Se uma palavra sobreviveu no meio da
 * frase, ele produz oito micro-substituições em vez de uma. O cliente
 * precisa ler "trocou esta frase por aquela", não um mosaico.
 */
function coalescer(ops, minIguais = 3) {
  const fundido = [];

  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];

    // Trecho igual curto, espremido entre duas mudanças? Absorve.
    if (op.tipo === 'igual') {
      const ws = (op.texto.match(/[^\s]+/g) || []).length;
      const mudancaAntes = fundido.some(o => o.tipo !== 'igual') &&
                           fundido[fundido.length - 1]?.tipo !== 'igual';
      const mudancaDepois = ops.slice(k + 1).find(o => o.tipo !== 'igual') &&
                            ops[k + 1] && ops[k + 1].tipo !== 'igual';

      if (ws < minIguais && mudancaAntes && mudancaDepois) {
        // Espaço puro entre duas mudanças é só separador: ele não pode
        // agir como barreira, senão o reagrupamento nunca acontece.
        fundido.push({ tipo: 'removido', texto: op.texto });
        fundido.push({ tipo: 'inserido', texto: op.texto });
        continue;
      }
    }
    fundido.push({ ...op });
  }

  // Reagrupa: todos os removidos de um bloco juntos, depois os inseridos.
  const saida = [];
  for (let k = 0; k < fundido.length; k++) {
    if (fundido[k].tipo === 'igual') { saida.push(fundido[k]); continue; }

    let rem = '', ins = '', fim = k;
    while (fim < fundido.length && fundido[fim].tipo !== 'igual') {
      if (fundido[fim].tipo === 'removido') rem += fundido[fim].texto;
      else ins += fundido[fim].texto;
      fim++;
    }
    if (rem) saida.push({ tipo: 'removido', texto: rem });
    if (ins) saida.push({ tipo: 'inserido', texto: ins });
    k = fim - 1;
  }

  return saida;
}

/** Números do que mudou — o resumo que vai no topo do relatório. */
function estatisticas(ops) {
  const contar = tipo => ops
    .filter(o => o.tipo === tipo)
    .reduce((s, o) => s + (o.texto.match(/[^\s]+/g) || []).length, 0);

  const iguais = contar('igual');
  const removidas = contar('removido');
  const inseridas = contar('inserido');
  const totalOriginal = iguais + removidas;

  return {
    palavrasOriginal: totalOriginal,
    palavrasRevisado: iguais + inseridas,
    removidas,
    inseridas,
    intactas: iguais,
    percentualAlterado: totalOriginal === 0 ? 0
      : Number(((removidas / totalOriginal) * 100).toFixed(1))
  };
}

/** Escapa para embutir em HTML sem quebrar a página. */
function escaparHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Diff em HTML, no estilo "controlar alterações" do Word. */
function paraHtml(ops) {
  return ops.map(o => {
    const t = escaparHtml(o.texto);
    if (o.tipo === 'igual') return t;
    if (ehEspaco(o.texto)) return t;   // não marca espaço puro, polui a leitura
    if (o.tipo === 'removido') return `<del>${t}</del>`;
    return `<ins>${t}</ins>`;
  }).join('');
}

/** Diff em texto puro, para WhatsApp e e-mail. */
function paraTexto(ops) {
  return ops.map(o => {
    if (o.tipo === 'igual' || ehEspaco(o.texto)) return o.texto;
    return o.tipo === 'removido' ? `[-${o.texto}-]` : `{+${o.texto}+}`;
  }).join('');
}

/**
 * Lista só as mudanças relevantes, com contexto — para o cliente que não
 * quer ler o texto inteiro marcado, só saber o que você mexeu.
 */
function listarMudancas(ops, contextoPalavras = 4) {
  const mudancas = [];

  for (let k = 0; k < ops.length; k++) {
    if (ops[k].tipo === 'igual') continue;

    // Agrupa remoção seguida de inserção como uma substituição só.
    let removido = '', inserido = '';
    let fim = k;
    while (fim < ops.length && ops[fim].tipo !== 'igual') {
      if (ops[fim].tipo === 'removido') removido += ops[fim].texto;
      else inserido += ops[fim].texto;
      fim++;
    }

    if (removido.trim() || inserido.trim()) {
      const pegarContexto = (idx, dir) => {
        const op = ops[idx];
        if (!op || op.tipo !== 'igual') return '';
        const ws = op.texto.match(/[^\s]+/g) || [];
        return (dir === 'antes' ? ws.slice(-contextoPalavras) : ws.slice(0, contextoPalavras)).join(' ');
      };

      mudancas.push({
        antes: pegarContexto(k - 1, 'antes'),
        removido: removido.trim(),
        inserido: inserido.trim(),
        depois: pegarContexto(fim, 'depois'),
        tipo: removido.trim() && inserido.trim() ? 'substituição'
            : removido.trim() ? 'remoção' : 'inserção'
      });
    }
    k = fim - 1;
  }

  return mudancas;
}

module.exports = {
  comparar, coalescer, estatisticas, paraHtml, paraTexto,
  listarMudancas, tokenizar, escaparHtml
};
