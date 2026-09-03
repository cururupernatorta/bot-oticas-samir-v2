# Custos de operação — Atende24

> Todo número aqui sai de `npm run custos` (`scripts/custos.js`). Nada é digitado
> à mão. Mudou preço de fornecedor ou câmbio? Muda a premissa no script e roda de
> novo — este documento é a leitura do modelo, não a fonte dele.

**Data da apuração:** setembro/2026 · **Câmbio efetivo usado:** R$ 5,40/US$

---

## Resumo: um servidor com 10 clientes

| | |
|---|---|
| Mensagens/mês | 65.500 |
| MRR | R$ 10.191 |
| Custo de operação | R$ 1.164 |
| Imposto + gateway + inadimplência + contador | R$ 1.624 |
| **Lucro real** | **R$ 7.403** (72,6% do MRR) |
| Custo fixo se todos cancelarem | **R$ 75** (só o servidor) |

O custo é quase todo variável. Isso é o que torna o negócio seguro: perder um
cliente tira receita, mas quase não deixa custo para trás.

---

## 1. Canal de WhatsApp — WAME API

| | Z-API (premissa antiga) | WAME API |
|---|---|---|
| Preço por instância/mês | ~R$ 99 | **a partir de R$ 28,99** |
| Mensagens | ilimitadas | ilimitadas |
| Conexão | QR Code | QR Code |
| Custo em 10 clientes | R$ 990/mês | **R$ 290/mês** |

**Economia: ~R$ 700/mês a cada 10 clientes.**

Uma instância por cliente — não dá para compartilhar, cada comércio tem o próprio
número. É o segundo maior custo variável do negócio, atrás só do suporte.

**Duas coisas a fazer:**
1. **Negocie volume.** A partir de 10 instâncias você é revenda, não usuário.
   Peça preço de parceiro antes de chegar em 10.
2. **Confirme o preço da faixa que você vai usar.** R$ 28,99 é o plano de entrada
   divulgado; valide limites e SLA do plano antes de fechar contrato com cliente.

⚠️ **WAME não-oficial é conexão via QR Code, igual à Z-API — o risco de bloqueio
do número continua existindo.** Não é a API oficial da Meta. Isso não muda o que
está no doc 09 do playbook: continue vendendo com honestidade e mantenha o caminho
de migração para a Cloud API oficial nos clientes maiores. A WAME oferece as duas
modalidades na mesma plataforma, o que facilita essa migração quando for a hora.

---

## 2. IA — o cache é o item mais importante deste documento

### O formato da nossa conversa

Medido em `src/utils/systemPrompt.js` com um cliente real (ótica, 3 lojas,
12 FAQs, conhecimento preenchido):

| Parte | Tokens | Muda entre mensagens? |
|---|---|---|
| System prompt (nicho + conhecimento + FAQ + unidades) | **~1.750** | **Não** |
| Histórico da conversa + contexto atual | ~120 | Sim |
| Resposta do bot | ~90 | Sim |

**93% dos tokens de entrada são a mesma coisa em toda mensagem.** E não só na
mesma conversa: o system prompt é idêntico para **todos os clientes finais
daquele comércio**. Uma entrada de cache serve a loja inteira.

### O que o cache faz com a conta

| Tipo de token de entrada | Multiplicador | Preço (Sonnet 5) |
|---|---|---|
| Entrada normal | 1,00× | US$ 2,00/milhão |
| Escrita no cache (TTL 5 min) | 1,25× | US$ 2,50/milhão |
| Escrita no cache (TTL 1 h) | 2,00× | US$ 4,00/milhão |
| **Leitura do cache** | **0,10×** | **US$ 0,20/milhão** |

| Volume | Cache quente | Com cache | Sem cache | Economia |
|---|---|---|---|---|
| 2.500 msgs/mês | 98,4% | R$ 16,07 | R$ 44,86 | 64% |
| 8.000 msgs/mês | 100% | R$ 48,30 | R$ 143,55 | 66% |
| 20.000 msgs/mês | 100% | R$ 120,74 | R$ 358,88 | 66% |

**Custo por mensagem em regime: R$ 0,006.** A premissa antiga do projeto era
R$ 0,033 — estava 5,5× acima.

### Por que TTL de 1 hora, e não 5 minutos

O cache de um cliente é mantido quente por **qualquer** mensagem de **qualquer**
consumidor daquele comércio. Modelando as chegadas como processo de Poisson:

| TTL | Cache quente (cliente Pro) | Custo de IA/mês |
|---|---|---|
| 5 minutos | 67% | R$ 85,13 |
| **1 hora** | **100%** | **R$ 45,06** |

A escrita de 1h custa o dobro, mas acontece uma ou duas vezes por dia em vez de
a cada intervalo de silêncio. **Padrão do sistema: `CACHE_TTL=1h`.**

### Por que Sonnet 5 e não Haiku 4.5

Haiku custa metade do Sonnet na tabela. Mas o **mínimo cacheável** decide:

| Modelo | Mínimo p/ cachear | Nosso prompt cacheia? | Custo/mês (Pro) |
|---|---|---|---|
| **Claude Sonnet 5** | 1.024 tokens | **Sim** (1.750) | **R$ 45,06** |
| Claude Haiku 4.5 | 4.096 tokens | **Não** | R$ 70,16 |
| Claude Opus 5 | 512 tokens | Sim | R$ 112,64 |

**Sonnet 5 com cache sai 36% mais barato que Haiku 4.5 sem cache**, e responde
melhor. Trocar para Haiku para "economizar" aumentaria a conta.

> Se um dia o system prompt passar de 4.096 tokens (cliente com conhecimento
> muito extenso), o Haiku volta para a mesa. Rode `npm run custos --modelo claude-haiku-4-5`.

### A armadilha que já estava montada

O prompt injetava **"ABERTA agora / FECHADA agora (reabre em...)"** dentro do
system prompt. Esse texto muda ao longo do dia — e **um único byte diferente
invalida o cache inteiro**. Com isso, o cache erraria em 100% das mensagens e
custaria 25% *a mais* que não ter cache, sem nenhum erro aparecendo em lugar nenhum.

Corrigido: o system prompt agora é 100% estável, e o que está aberto neste momento
vai num bloco `<contexto_atual>` na última mensagem, **depois** do breakpoint.

O `npm test` trava isso: gera o prompt em quatro momentos diferentes do dia e da
semana e falha se um único byte divergir. Rode sempre que mexer no prompt.

### Como conferir na prática

```bash
LOG_CACHE=1 npm start
# [CACHE] leu 1750 · escreveu 0 · normal 118   ← saudável
# [CACHE] leu 0 · escreveu 1750 · normal 118   ← toda mensagem: algo invalidou
```

Se `leu` for sempre 0, alguma coisa voltou a entrar no prefixo. É a falha mais
cara e mais silenciosa que este sistema pode ter.

---

## 3. Servidor

### O que a carga realmente exige

Com 10 clientes e 65.500 mensagens/mês:

| | |
|---|---|
| Mensagens/dia | 2.183 |
| Mensagens/minuto (média na janela ativa) | 2,6 |
| Mensagens/minuto no pico (8×) | 20,8 |
| Chamadas de IA simultâneas no pico | 1,4 |
| **CPU no pico (1 núcleo)** | **0,17%** |
| RAM do MongoDB | ~235 MB |
| Disco em regime (TTL de 60 dias) | ~115 MB |

O trabalho é I/O, não CPU: o servidor passa o tempo esperando a resposta da IA.

### Recomendação

**VPS de 4 vCPU / 8 GB / 80 GB NVMe — R$ 45 a R$ 75/mês**, com MongoDB no mesmo
servidor.

| Opção | Configuração | Preço aprox. |
|---|---|---|
| Hetzner CX32 | 4 vCPU / 8 GB / 80 GB | ~€7,90 (~R$ 47) |
| Contabo VPS | 4 vCPU / 8 GB / 100 GB NVMe | ~€5,50 (~R$ 33) |
| Hostinger KVM 2 | 2 vCPU / 8 GB / 100 GB NVMe | ~US$ 6,99 (~R$ 38) |

Some ~20% de backup automático e reserve algo para monitoramento. **R$ 75/mês** é
a premissa usada no modelo, com folga.

> **Saia do Render antes do terceiro cliente.** O plano gratuito hiberna o serviço
> após inatividade: a primeira mensagem da manhã esperaria o cold start. Num
> produto que vende "resposta em 5 segundos, 24h", isso é falha de entrega.
> O plano pago do Render custa mais que um VPS com o dobro de recurso.

### Por que 10 clientes por servidor, se cabem 50

Não é limite técnico — na conta acima o servidor fica com ~20× de folga.
O limite é de **risco e de suporte**:

- Um servidor fora do ar são **10 contratos parados** ao mesmo tempo. Com 50, é o negócio inteiro.
- 10 clientes já ocupam uma pessoa em onboarding, ajuste de conhecimento e suporte.
- Servidor novo custa R$ 75. Reputação queimada com 50 clientes ao mesmo tempo, não.

**Regra: um servidor a cada 10 clientes. Cliente 11 abre servidor 2.**

### O que foi corrigido para isso ser verdade

O banco **não tinha nenhum índice**. Cada mensagem recebida fazia varredura
completa da coleção de conversas, que crescia sem limite — em um ano com 10
clientes seriam mais de 200 mil documentos, e o tempo de resposta degradaria
exatamente onde o produto promete não degradar.

Agora `src/config/indices.js` cria no boot, de forma idempotente: índice único em
`conversations.key`, índices de lead por cliente/status, `stats` por cliente/dia,
e **TTL de 60 dias** em `conversations` para o disco parar de crescer sem fim.

---

## 4. Custo total por cliente

| Plano | Receita | IA | WAME | Suporte | Servidor | **Custo** | **Lucro** | Margem |
|---|---|---|---|---|---|---|---|---|
| Essencial | R$ 397 | R$ 16 | R$ 29 | R$ 25 | R$ 7,50 | **R$ 77** | **R$ 320** | 80,7% |
| Start | R$ 900 | R$ 19 | R$ 29 | R$ 40 | R$ 7,50 | **R$ 95** | **R$ 806** | 89,5% |
| Pro | R$ 1.300 | R$ 48 | R$ 29 | R$ 50 | R$ 7,50 | **R$ 135** | **R$ 1.166** | 89,7% |
| Enterprise | R$ 2.000 | R$ 121 | R$ 29 | R$ 60 | R$ 7,50 | **R$ 217** | **R$ 1.784** | 89,2% |

### Mas essa margem não é o que sobra

Margem operacional não é lucro. Sobre o MRR de R$ 10.191 de um servidor cheio:

| | |
|---|---|
| MRR bruto | R$ 10.191 |
| − Operação (IA + WAME + servidor + suporte) | − R$ 1.164 |
| − Imposto (Simples Nacional, 6%) | − R$ 611 |
| − Gateway de pagamento (3,5%) | − R$ 357 |
| − Inadimplência (3%) | − R$ 306 |
| − Contador | − R$ 350 |
| **= Lucro real** | **R$ 7.403** — 72,6% do MRR |

**Confirme sua faixa do Simples com o contador.** O Anexo III começa em 6% mas
sobe por faixa de faturamento; acima de R$ 180 mil/ano a alíquota efetiva muda.

---

## 5. O que rever, e quando

| Premissa | Onde | Revisar quando |
|---|---|---|
| Câmbio efetivo (R$ 5,40) | `CAMBIO_USD_BRL` | Todo mês. Inclui IOF de 3,5% + spread do cartão |
| Preço da IA | `src/utils/custoTokens.js` | Quando a Anthropic mudar a tabela |
| Tokens do system prompt | `PREMISSAS.tokensSystemPrompt` | Quando cadastrar cliente com conhecimento muito maior |
| % respondida sem IA (30%) | `PREMISSAS.fracaoSemIA` | Depois do 1º mês real — o painel conta `respostasFaq` |
| Preço WAME | `PREMISSAS.wameMensalPorInstancia` | Ao negociar volume |
| Alíquota do Simples | `PREMISSAS.aliquotaImposto` | Ao mudar de faixa |

```bash
npm run custos                          # cenário padrão
npm run custos -- --msgs 12000          # um cliente específico
npm run custos -- --ttl 5m              # comparar TTL
npm run custos -- --cambio 6.20         # estressar o câmbio
npm run custos -- --wame 45 --servidor 120   # estressar fornecedores
```

**Refaça esta apuração no mês 3 com dados reais do painel** (`/admin` → uso do
mês mostra tokens e custo de IA por cliente). As premissas de tráfego são as mais
incertas de todas — só o uso real resolve.
