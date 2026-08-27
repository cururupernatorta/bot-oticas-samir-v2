# ✍️ Estúdio de Texto

Segunda fonte de renda: serviço de **revisão, humanização e copy**, com a
máquina fazendo a produção e você fazendo o julgamento.

---

## A tese: o mercado virou halteres

Pesquisa de agosto de 2026. O mercado de texto se partiu em dois, e o meio
sumiu:

| Ponta | O que acontece |
|---|---|
| **Commodity** — "escreve 500 palavras barato" | Encolhendo. Contratos de revisão caindo ~2% ao mês, ganho mensal −5%. Qualquer um faz com IA. |
| **Julgamento** — voz, checagem, consistência | **Subindo de preço.** É o que IA sozinha não entrega e cliente percebe. |

O erro comum é entrar na ponta de baixo porque parece mais fácil. É onde
não há margem e a concorrência é infinita.

**O que este sistema vende é a ponta de cima** — e o que faz isso ser
possível não é escrever melhor, é **provar** que melhorou.

### Por que a prova é o produto

Duas entregas idênticas de texto não valem o mesmo:

- Sem relatório: o cliente recebe outro texto e precisa acreditar em você.
- Com relatório: o cliente vê o score cair de 88 para 12, o controle de
  alterações e as verificações de segurança.

A primeira vale R$ 25. A segunda vale R$ 250. O texto é o mesmo.

---

## Como funciona

```
   analisar ──> orçar ──> revisar ──> QA ──> relatório
   determinístico        multi-passe   determinístico
   (sem LLM)             (Claude)      (sem LLM)
```

O desenho tem um princípio: **o modelo executa, o código julga.** LLM é bom
seguindo instrução específica e ruim avaliando o próprio trabalho. Então
quem mede é código determinístico, antes e depois.

### 1. Analisador — `analisador.js`
Mede "cheiro de IA" em português **sem chamar LLM nenhum**. Cinco indícios:

| Indício | O que mede |
|---|---|
| **Ritmo das frases** | Coeficiente de variação do comprimento. Gente varia, IA converge. |
| **Frases-carimbo** | "no cenário atual", "vale ressaltar", "em suma"… |
| **Vocabulário-fantasma** | "crucial", "robusto", "alavancar", "potencializar"… |
| **Excesso de conectivos** | Costura mecânica entre frases. |
| **Blocos de parágrafo** | Parágrafos todos do mesmo tamanho, como fôrma. |

Validado contra amostras reais: texto de IA pontua **88–89**, texto humano
pontua **0**. A separação é ampla, não é ruído.

Como é determinístico, o mesmo texto dá o mesmo número sempre — que é o
que permite colocar o número num relatório e cobrar por ele.

### 2. Orçamento — `orcamento.js`
Lê o texto e devolve preço, prazo e memória de cálculo em segundos.
Responder orçamento em 2 minutos ganha de responder em 6 horas, mesmo
cobrando mais caro.

Também **recomenda o serviço certo**: se o texto pontua 70, revisão
gramatical não resolve — o problema é ritmo, não vírgula. Vender o serviço
errado gera cliente insatisfeito, que custa mais que cliente perdido.

### 3. Revisor — `revisor.js`
Passes sucessivos, cada um mirando um problema **medido**. O analisador
roda antes e diz exatamente o que corrigir; esses achados entram no prompt.

> Pedir "deixe mais natural" devolve outro texto de IA.
> Pedir "corte estas 6 expressões, quebre o ritmo destas frases de 22
> palavras" devolve trabalho feito.

Para no primeiro passe que não melhora — insistir degrada.

### 4. Portão de qualidade — `qa.js`
Sete checagens determinísticas contra as reclamações que derrubam avaliação
de freelancer:

- Número inventado (o erro mais caro da revisão com IA) → **bloqueio**
- Link, e-mail ou perfil removido → **bloqueio**
- Texto truncado → **bloqueio**
- Comprimento, estrutura de parágrafos, revisão efetiva, score melhorou → aviso

### 5. Relatório — `relatorio.js`
HTML autocontido: abre no navegador, imprime em PDF, anexa no e-mail. Sem
dependência, sem servidor, sem link que expira.

---

## Catálogo e preços

Ancorados em pesquisa de mercado (revisão BR R$ 3–20/lauda; copy BR
R$ 200–500/h; Fiverr 2026 US$ 75–250 de pacote inicial):

| Serviço | Preço | Prazo |
|---|---|---|
| **Diagnóstico** | R$ 90 fixo | 4h |
| **Revisão gramatical e de estilo** | R$ 9/lauda (mín. R$ 60) | 24h |
| **Revisão + humanização** ⭐ | R$ 19/lauda (mín. R$ 120) | 48h |
| **Copy de conversão** | R$ 220 anúncio · R$ 850 página · R$ 1.600 sequência | 72h |
| **Retainer mensal** | R$ 900 / R$ 1.800 / R$ 3.200 | 12–24h |

Multiplicadores: urgência ×1,4 (metade do prazo) ou ×2,0 (mesmo dia);
material técnico ×1,35; literário ×1,2.

**O diagnóstico de R$ 90 é isca de propósito.** É barato, rápido, e o
relatório vende sozinho a revisão completa.

---

## Uso

```bash
# Rodam offline — sem Mongo, sem chave de API
npm run texto analisar  texto.txt
npm run texto orcar     texto.txt            # recomenda o serviço e já orça
npm run texto orcar     texto.txt revisao expresso tecnico
npm run texto relatorio original.txt revisado.txt --saida rel.html
npm run texto tabela                          # catálogo e multiplicadores

# Precisa de CLAUDE_API_KEY
npm run texto revisar   texto.txt --alvo 25
```

`revisar` grava dois arquivos: o texto revisado e o relatório HTML pronto
para enviar.

---

## O que é seu e o que é da máquina

A divisão que torna isso viável nas plataformas — a Fiverr permite IA mas
exige julgamento humano em toda entrega, e **exige divulgação** quando o
resultado é predominantemente gerado:

| Máquina | Você |
|---|---|
| Analisar e pontuar | Aceitar ou recusar o trabalho |
| Orçar e recomendar | Falar com o cliente |
| Revisar em passes | **Ler o resultado antes de entregar** |
| Rodar as 7 checagens | Julgar o que o QA sinalizou |
| Gerar o relatório | Enviar e responder |

A divulgação de IA está embutida no rodapé de todo relatório
(`config.js` → `DIVULGACAO`). Omitir isso é o caminho mais curto para
perder a conta, e não vale um pedido.

---

## Estado atual

**130 testes passando** no repositório inteiro, sendo 67 deste módulo:
analisador (21), diff (16), orçamento (18), QA (12).

**Testado de ponta a ponta sem rede:** analisar, orçar, gerar relatório.
Score 88 → 0 num caso real, QA aprovado, HTML válido e autocontido.

**Não testado end-to-end:** `revisar` chama a API do Claude e precisa de
chave. A lógica em volta (briefing de problemas, decisão de parada,
QA sobre o resultado) está coberta por teste.

**Antes de vender:** rode `npm run texto revisar` em cinco textos seus e
leia as saídas. Você precisa saber como a máquina escreve antes de colocar
seu nome na entrega.
