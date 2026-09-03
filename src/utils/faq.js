/**
 * MATCHER DE FAQ — resposta instantânea, custo zero de IA.
 *
 * O matcher antigo usava `includes` nos dois sentidos: com um FAQ de 15 perguntas
 * qualquer mensagem curta casava com a pergunta errada. Aqui usamos sobreposição
 * de termos relevantes + palavras-chave opcionais, com nota mínima de corte.
 *
 * Formato de cada item do FAQ:
 *   { pergunta, resposta, palavrasChave?: ['entrega','frete'] }
 */

const STOPWORDS = new Set([
  'a','o','as','os','de','da','do','das','dos','e','ou','em','no','na','nos','nas','um','uma','uns','umas',
  'para','pra','por','com','sem','que','qual','quais','quanto','quanta','quantos','quantas','como','onde',
  'quando','quem','se','eu','voce','voces','vc','vcs','me','meu','minha','ta','tem','tenho','ha','sao','e',
  'ser','esta','estao','ai','la','isso','esse','essa','ele','ela','ao','aos','a','mais','ja','so','muito'
]);

function normalizar(texto = '') {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function termos(texto = '') {
  return normalizar(texto)
    .split(' ')
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
    .map(t => (t.length > 5 ? t.slice(0, -1) : t)); // radical simples: cobre plural/flexão
}

/**
 * Procura a melhor resposta de FAQ para a mensagem.
 * Retorna { item, nota } ou null se nada passar do corte.
 */
function buscarFaq(mensagem, faq = [], notaMinima = 0.6) {
  if (!mensagem || !Array.isArray(faq) || faq.length === 0) return null;

  const alvo = termos(mensagem);
  if (alvo.length === 0) return null;
  const alvoSet = new Set(alvo);

  let melhor = null;

  for (const item of faq) {
    if (!item || !item.pergunta || !item.resposta) continue;

    // Palavra-chave explícita presente na mensagem = casamento direto.
    const chaves = (item.palavrasChave || []).map(normalizar).filter(Boolean);
    const chaveBatida = chaves.some(c => normalizar(mensagem).includes(c));

    const daPergunta = termos(item.pergunta);
    if (daPergunta.length === 0 && !chaveBatida) continue;

    const acertos = daPergunta.filter(t => alvoSet.has(t)).length;
    // cobertura da pergunta cadastrada + cobertura da mensagem do cliente
    const coberturaPergunta = daPergunta.length ? acertos / daPergunta.length : 0;
    const coberturaMensagem = acertos / alvo.length;
    let nota = coberturaPergunta * 0.7 + coberturaMensagem * 0.3;
    if (chaveBatida) nota = Math.max(nota, 0.95);

    if (!melhor || nota > melhor.nota) melhor = { item, nota };
  }

  return melhor && melhor.nota >= notaMinima ? melhor : null;
}

module.exports = { buscarFaq, normalizar, termos };
