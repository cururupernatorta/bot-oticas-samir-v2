const { chamarClaude } = require('../services/claudeService');
const { analisar } = require('./analisador');

/**
 * REVISOR — passes sucessivos, cada um mirando um problema medido.
 *
 * O que faz isso funcionar melhor que "melhore este texto": o analisador
 * roda ANTES e diz exatamente o que está errado — quais frases-carimbo,
 * quais palavras-fantasma, qual o ritmo. Esses achados entram no prompt.
 *
 * Pedir "deixe mais natural" devolve outro texto de IA. Pedir "corte
 * estas 6 expressões, quebre o ritmo destas frases de 22 palavras"
 * devolve trabalho feito. O modelo é bom executando instrução específica
 * e ruim julgando a si mesmo — então quem julga é o código.
 */

const SYSTEM_REVISAO = `Você é um revisor de textos brasileiro, experiente, que trabalha para clientes exigentes.

Sua tarefa é reescrever o texto recebido corrigindo os problemas APONTADOS, sem inventar conteúdo.

REGRAS INEGOCIÁVEIS:
- Nunca invente fato, número, nome, data ou citação que não esteja no original.
- Nunca mude o significado. Se o original afirma algo, o revisado afirma a mesma coisa.
- Preserve a estrutura de parágrafos e qualquer formatação (títulos, listas).
- Mantenha aproximadamente o mesmo comprimento, salvo instrução contrária.
- Português brasileiro.

COMO ESCREVER NATURAL:
- Varie o comprimento das frases de propósito. Frase curta depois de frase longa. Assim.
- Corte conectivo que não carrega sentido ("além disso", "dessa forma", "nesse sentido").
- Troque palavra de catálogo por palavra concreta: não "solução robusta", mas o que a coisa faz.
- Deixe o texto começar pelo assunto, não por preâmbulo.
- Nem todo parágrafo precisa de conclusão. Alguns só terminam.

Responda SOMENTE com o texto revisado. Sem comentário, sem markdown de cerca, sem preâmbulo.`;

/** Monta a lista de problemas concretos que o passe deve atacar. */
function briefingDeProblemas(analise) {
  const linhas = [];

  for (const ind of analise.indicios) {
    if (ind.suspeita < 30) continue;

    if (ind.nome === 'Ritmo das frases') {
      linhas.push(`RITMO: ${ind.medida}. As frases estão quase todas do mesmo tamanho. Quebre isso — misture frases de 4 palavras com frases de 25.`);
    } else if (ind.nome === 'Frases-carimbo' && ind.itens?.length) {
      linhas.push(`REMOVER estas expressões (são carimbo de IA): ${ind.itens.map(i => `"${i.termo}"`).join(', ')}.`);
    } else if (ind.nome === 'Vocabulário-fantasma' && ind.itens?.length) {
      linhas.push(`SUBSTITUIR por palavra concreta: ${ind.itens.map(i => `"${i.termo}"`).join(', ')}.`);
    } else if (ind.nome === 'Excesso de conectivos' && ind.itens?.length) {
      linhas.push(`CORTAR conectivos supérfluos (${ind.medida}): ${ind.itens.slice(0, 8).map(i => `"${i.termo}"`).join(', ')}.`);
    } else if (ind.nome === 'Blocos de parágrafo') {
      linhas.push(`PARÁGRAFOS: ${ind.medida}. Estão todos do mesmo tamanho. Deixe alguns curtos, de uma linha só.`);
    }
  }

  const bg = analise.metricas.bigramasRepetidos;
  if (bg?.length) {
    linhas.push(`REPETIÇÃO: estas duplas se repetem — ${bg.slice(0, 5).map(b => `"${b.bigrama}" (${b.n}×)`).join(', ')}.`);
  }

  return linhas;
}

/** Executa um passe de revisão mirando os problemas medidos. */
async function passe(texto, analise, instrucaoExtra = '') {
  const problemas = briefingDeProblemas(analise);

  const entrada = [
    `PROBLEMAS MEDIDOS NESTE TEXTO (score ${analise.score}/100 de cheiro de IA):`,
    ...problemas.map(p => '- ' + p),
    instrucaoExtra ? `\nINSTRUÇÃO DO CLIENTE: ${instrucaoExtra}` : '',
    '',
    'TEXTO A REVISAR:',
    texto
  ].filter(Boolean).join('\n');

  const maxTokens = Math.min(8000, Math.max(1000, Math.ceil(texto.length / 2)));
  const { texto: saida, usage } = await chamarClaude(SYSTEM_REVISAO, [{ role: 'user', content: entrada }], maxTokens);

  const limpo = saida.trim()
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  return { texto: limpo, usage, problemasAtacados: problemas.length };
}

/**
 * Revisa até o score cair abaixo do alvo ou acabarem os passes.
 *
 * Para no primeiro passe que não melhora: insistir com o mesmo modelo
 * sobre o mesmo texto tende a degradar, não a melhorar.
 */
async function revisar(texto, { alvo = 30, maxPasses = 3, instrucao = '' } = {}) {
  const historico = [];
  let atual = texto;
  let analiseAtual = analisar(atual);
  const analiseInicial = analiseAtual;

  let tokensTotal = { input: 0, output: 0 };

  for (let n = 1; n <= maxPasses; n++) {
    if (analiseAtual.score <= alvo) break;

    const r = await passe(atual, analiseAtual, n === 1 ? instrucao : '');
    tokensTotal.input += r.usage?.input_tokens || 0;
    tokensTotal.output += r.usage?.output_tokens || 0;

    if (!r.texto) {
      historico.push({ passe: n, erro: 'modelo devolveu texto vazio' });
      break;
    }

    const novaAnalise = analisar(r.texto);
    historico.push({
      passe: n,
      scoreAntes: analiseAtual.score,
      scoreDepois: novaAnalise.score,
      problemasAtacados: r.problemasAtacados
    });

    // Piorou ou empatou: o passe não está ajudando. Fica com o melhor.
    if (novaAnalise.score >= analiseAtual.score) {
      historico[historico.length - 1].descartado = true;
      break;
    }

    atual = r.texto;
    analiseAtual = novaAnalise;
  }

  return {
    original: texto,
    revisado: atual,
    analiseInicial,
    analiseFinal: analiseAtual,
    ganho: analiseInicial.score - analiseAtual.score,
    passes: historico,
    tokens: tokensTotal,
    alcancouAlvo: analiseAtual.score <= alvo
  };
}

module.exports = { revisar, passe, briefingDeProblemas, SYSTEM_REVISAO };
