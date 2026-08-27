const { paraHtml, listarMudancas, estatisticas, comparar, coalescer, escaparHtml } = require('./diff');
const { DIVULGACAO } = require('./config');

/**
 * RELATÓRIO DE ENTREGA — o que o cliente recebe junto com o texto.
 *
 * Esta é a peça que sustenta o preço. Duas entregas idênticas de texto,
 * uma com relatório e outra sem, não valem o mesmo: a com relatório
 * mostra trabalho, a sem pede fé. Cobrar R$ 250 em vez de R$ 25 não é
 * questão de escrever melhor, é de provar que escreveu.
 *
 * HTML autocontido de propósito: abre no navegador, imprime em PDF,
 * anexa no e-mail. Sem dependência, sem servidor, sem link que expira.
 */

function barraScore(valor, cor) {
  const largura = Math.max(2, Math.min(100, valor));
  return `<div class="trilho"><div class="preenche" style="width:${largura}%;background:${cor}"></div></div>`;
}

function secaoIndicios(indicios) {
  if (!indicios?.length) return '';
  const linhas = indicios.map(i => `
      <tr>
        <td>${escaparHtml(i.nome)}</td>
        <td class="num">${Math.round(i.suspeita)}</td>
        <td class="fraco">${escaparHtml(i.leitura || '')}</td>
      </tr>`).join('');

  return `
    <h2>O que foi encontrado no original</h2>
    <table>
      <thead><tr><th>Indício</th><th class="num">Peso</th><th>Leitura</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>`;
}

function secaoMudancas(mudancas, limite = 40) {
  if (!mudancas.length) return '<p class="fraco">Nenhuma alteração registrada.</p>';

  const itens = mudancas.slice(0, limite).map(m => `
      <li>
        ${m.removido ? `<span class="fora">${escaparHtml(m.removido)}</span>` : ''}
        ${m.removido && m.inserido ? '<span class="seta">→</span>' : ''}
        ${m.inserido ? `<span class="dentro">${escaparHtml(m.inserido)}</span>` : ''}
      </li>`).join('');

  const resto = mudancas.length > limite
    ? `<p class="fraco">+ outras ${mudancas.length - limite} alterações no texto marcado abaixo.</p>` : '';

  return `<ul class="mudancas">${itens}</ul>${resto}`;
}

/**
 * Gera o relatório completo.
 * @param {object} dados - resultado de revisar() + metadados do trabalho
 */
function gerar({
  cliente = '', titulo = 'Relatório de revisão', original, revisado,
  analiseInicial, analiseFinal, qa, servico = '', divulgacao = 'assistida'
}) {
  const ops = coalescer(comparar(original, revisado));
  const st = estatisticas(ops);
  const mudancas = listarMudancas(ops);

  const ganho = analiseInicial.score - analiseFinal.score;
  const corAntes = analiseInicial.score >= 60 ? '#c0392b' : analiseInicial.score >= 35 ? '#c87f0a' : '#2e7d5b';
  const corDepois = analiseFinal.score >= 60 ? '#c0392b' : analiseFinal.score >= 35 ? '#c87f0a' : '#2e7d5b';

  const checagens = (qa?.checagens || []).map(c => `
      <tr>
        <td>${c.passou ? '<span class="ok">✓</span>' : '<span class="nao">!</span>'} ${escaparHtml(c.nome)}</td>
        <td class="fraco">${escaparHtml(c.detalhe)}</td>
      </tr>`).join('');

  const alertas = (qa?.alertas || []).filter(a => a.nivel === 'atenção').map(a =>
    `<li>${escaparHtml(a.mensagem)}</li>`).join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escaparHtml(titulo)}</title>
<style>
  :root { --tinta:#1a2b33; --fraco:#5f7178; --linha:#dde5e6; --papel:#fff; --fundo:#f6f8f8; }
  * { box-sizing:border-box; }
  body { font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         color:var(--tinta); background:var(--fundo); margin:0; padding:2rem 1.25rem 4rem; }
  .folha { max-width:46rem; margin:0 auto; background:var(--papel); padding:2.5rem;
           border:1px solid var(--linha); border-radius:4px; }
  h1 { font-size:1.6rem; margin:0 0 .3rem; }
  h2 { font-size:1.1rem; margin:2.2rem 0 .7rem; padding-bottom:.35rem; border-bottom:1px solid var(--linha); }
  .sub { color:var(--fraco); margin:0 0 1.5rem; font-size:.95rem; }
  .placar { display:grid; grid-template-columns:1fr auto 1fr; gap:1rem; align-items:center;
            background:var(--fundo); border:1px solid var(--linha); border-radius:4px; padding:1.25rem; }
  .placar .lado { text-align:center; }
  .placar .n { font-size:2.1rem; font-weight:700; line-height:1; font-variant-numeric:tabular-nums; }
  .placar .rot { font-size:.72rem; text-transform:uppercase; letter-spacing:.09em; color:var(--fraco); }
  .placar .seta-g { font-size:1.5rem; color:var(--fraco); }
  .trilho { height:6px; background:var(--linha); border-radius:3px; overflow:hidden; margin-top:.5rem; }
  .preenche { height:100%; border-radius:3px; }
  .resumo { display:grid; grid-template-columns:repeat(auto-fit,minmax(8rem,1fr)); gap:1px;
            background:var(--linha); border:1px solid var(--linha); border-radius:4px; overflow:hidden; margin-top:1rem; }
  .resumo div { background:var(--papel); padding:.85rem 1rem; }
  .resumo .v { font-size:1.25rem; font-weight:600; font-variant-numeric:tabular-nums; }
  .resumo .r { font-size:.75rem; color:var(--fraco); }
  table { width:100%; border-collapse:collapse; font-size:.92rem; }
  th,td { text-align:left; padding:.5rem .6rem .5rem 0; border-bottom:1px solid var(--linha); vertical-align:top; }
  th { font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; color:var(--fraco); }
  td.num,th.num { text-align:right; font-variant-numeric:tabular-nums; }
  .fraco { color:var(--fraco); }
  .ok { color:#2e7d5b; font-weight:700; }
  .nao { color:#c87f0a; font-weight:700; }
  ul.mudancas { list-style:none; padding:0; margin:0; }
  ul.mudancas li { padding:.55rem 0; border-bottom:1px solid var(--linha); font-size:.92rem; }
  .fora { background:#fdecea; color:#8a2318; text-decoration:line-through; padding:.05rem .25rem; border-radius:2px; }
  .dentro { background:#e8f5ee; color:#1c5c40; padding:.05rem .25rem; border-radius:2px; }
  .seta { color:var(--fraco); margin:0 .35rem; }
  .marcado { background:var(--fundo); border:1px solid var(--linha); border-radius:4px;
             padding:1.25rem; font-size:.93rem; white-space:pre-wrap; overflow-wrap:break-word; }
  .marcado del { background:#fdecea; color:#8a2318; }
  .marcado ins { background:#e8f5ee; color:#1c5c40; text-decoration:none; }
  .aviso { background:#fff8e6; border:1px solid #f0dfa8; border-radius:4px; padding:.9rem 1.1rem; font-size:.9rem; }
  .aviso ul { margin:.4rem 0 0; padding-left:1.1rem; }
  footer { margin-top:2.5rem; padding-top:1rem; border-top:1px solid var(--linha);
           font-size:.83rem; color:var(--fraco); }
  @media print { body { background:#fff; padding:0; } .folha { border:none; padding:0; } }
</style>
</head>
<body>
<div class="folha">

  <h1>${escaparHtml(titulo)}</h1>
  <p class="sub">${cliente ? escaparHtml(cliente) + ' · ' : ''}${escaparHtml(servico)} · ${new Date().toLocaleDateString('pt-BR')}</p>

  <div class="placar">
    <div class="lado">
      <div class="n" style="color:${corAntes}">${analiseInicial.score}</div>
      <div class="rot">antes</div>
      ${barraScore(analiseInicial.score, corAntes)}
    </div>
    <div class="seta-g">→</div>
    <div class="lado">
      <div class="n" style="color:${corDepois}">${analiseFinal.score}</div>
      <div class="rot">depois</div>
      ${barraScore(analiseFinal.score, corDepois)}
    </div>
  </div>
  <p class="sub" style="margin-top:.8rem">
    Índice de naturalidade da escrita: 0 significa que lê como texto humano, 100 que lê como texto de máquina.
    ${ganho > 0 ? `Este trabalho reduziu <strong>${ganho} pontos</strong>.` : ''}
  </p>

  <div class="resumo">
    <div><div class="v">${st.palavrasOriginal}</div><div class="r">palavras no original</div></div>
    <div><div class="v">${st.palavrasRevisado}</div><div class="r">palavras entregues</div></div>
    <div><div class="v">${st.percentualAlterado}%</div><div class="r">do texto alterado</div></div>
    <div><div class="v">${mudancas.length}</div><div class="r">alterações</div></div>
  </div>

  ${secaoIndicios(analiseInicial.indicios)}

  <h2>Verificações de segurança</h2>
  <table><tbody>${checagens}</tbody></table>
  ${alertas ? `<div class="aviso" style="margin-top:1rem"><strong>Pontos para você conferir:</strong><ul>${alertas}</ul></div>` : ''}

  <h2>Principais alterações</h2>
  ${secaoMudancas(mudancas)}

  <h2>Texto com alterações marcadas</h2>
  <div class="marcado">${paraHtml(ops)}</div>

  <h2>Texto final</h2>
  <div class="marcado">${escaparHtml(revisado)}</div>

  <footer>
    ${escaparHtml(DIVULGACAO[divulgacao] || DIVULGACAO.assistida)}
  </footer>

</div>
</body>
</html>`;
}

module.exports = { gerar };
