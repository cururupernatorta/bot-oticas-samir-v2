# Atende24 — Plataforma de Atendimento 24h no WhatsApp

Plataforma **multi-tenant** de atendimento automatizado por WhatsApp: um servidor,
N clientes, cada um com a personalidade, o conhecimento e as regras do seu próprio
nicho.

Nasceu do bot de atendimento das **Óticas Samir** e foi generalizada para ser
vendida a qualquer comércio ou prestador de serviço, sem reescrever código por cliente.

> **Posicionamento:** recepcionista digital 24h — não vende no lugar do vendedor.
> Responde, qualifica, encaminha para a unidade certa e entrega o contexto pronto
> para o humano fechar.

📘 **O plano comercial completo** (marketing, prospecção, nichos, precificação,
scripts, contrato) está em **[`docs/comercial/`](docs/comercial/README.md)**.

💰 **A apuração de custos** (WAME API, servidor, IA com cache) está em
**[`docs/CUSTOS.md`](docs/CUSTOS.md)** — e é reproduzível com `npm run custos`.

---

## O que mudou na v4 (Plataforma)

| Antes (v3.1) | Agora (v4) |
|---|---|
| Horário das lojas **hardcoded** por nome (`if nome.includes('toledo')`) | Motor de horários orientado a dados, com múltiplos turnos e fuso por cliente |
| Prompt genérico, igual para todos | **15 pacotes de nicho** com vocabulário, roteiro e compliance próprios |
| FAQ casado por `includes` (falso-positivo com FAQ grande) | Matcher por relevância + palavras-chave, com nota de corte |
| `"sim"` no meio da conversa caía num atalho e resetava o atendimento | Atalhos só quando fazem sentido no contexto |
| Alerta de lead não respondido repetia a cada 30 min, para sempre | Máximo 2 alertas, com escalonamento |
| `buttonId` quebrava se o `clientId` tivesse `_` | Separador seguro, com retrocompatibilidade |
| Falha de IA deixava o cliente sem resposta e ninguém sabia | Retry com backoff + alerta para a equipe |
| Sem testes | Smoke test end-to-end (`npm test`) |
| Sem prompt caching, e com status ao vivo dentro do prompt | Cache do system prompt (−66% no custo de IA) com trava de regressão no teste |
| Banco sem nenhum índice; conversas crescendo sem limite | Índices criados no boot + TTL de 60 dias |

---

## Pacotes de nicho

O que faz o produto ser vendável para qualquer segmento sem virar projeto sob medida.

👓 Óticas · 🦷 Odontologia · ✨ Estética · 🐶 Pet shop · 🏠 Imobiliária ·
💪 Academia · 💈 Salão e barbearia · 🔧 Oficina · 🍕 Restaurante e delivery ·
🧱 Materiais de construção · 🛠️ Assistência técnica · 🎓 Escolas e cursos ·
⚖️ Advocacia · 🛋️ Móveis planejados · 🏪 Genérico

Cada pacote (`src/config/nichos/*.js`) define:

| Campo | Para quê |
|---|---|
| `vocabulario` | "paciente", "tutor", "aluno" — o bot fala a língua do setor |
| `objetivo` | O que conta como atendimento bem-sucedido ali |
| `qualificacao` | O que descobrir antes de passar para o humano |
| `limites` | **O que o bot é proibido de dizer** — o argumento que fecha venda em setor regulado |
| `faqBase` | As perguntas que sempre chegam naquele segmento |
| `kpis` | O que mostrar no relatório para o cliente perceber valor |
| `comercial` | Plano sugerido, volume típico, dor principal e gancho de abordagem |

**Criar um nicho novo:** copie um arquivo, ajuste os campos, rode `npm test`.
Ele aparece automaticamente no painel e no CLI. Leva ~40 minutos.

---

## Arquitetura

```
WhatsApp do cliente
      │
   Z-API  ──POST──►  /webhook/:clientId
                          │
                    botService
                    ├── FAQ (custo zero)          ── responde e para
                    ├── Saudação/emoji (custo zero) ── responde e para
                    └── IA (Claude)
                          │ prompt = pacote de nicho + dados do cliente
                          ▼
                    resposta + marcadores invisíveis
                    [UNIDADE:n] [LEAD_PRONTO] [HUMANO] [AVISO_HORARIO]
                          │
              ┌───────────┼───────────────┐
              ▼           ▼               ▼
        cliente     WhatsApp da       MongoDB
                    unidade +         (conversas, leads,
                    botão Assumir      uso, faturas)
```

## Estrutura

```
src/
├── config/
│   ├── nichos/          ← 15 pacotes de nicho + carregador automático
│   ├── planos.js        ← planos, custos, margens e projeção de carteira
│   └── database.js
├── services/
│   ├── botService.js    ← orquestração do atendimento
│   ├── claudeService.js ← IA com retry e backoff
│   ├── zapiService.js   ← canal WhatsApp (isolado: trocar de provedor mexe aqui só)
│   └── relatorioService.js ← crons: relatórios, alertas, faturamento
├── utils/
│   ├── horarios.js      ← motor de horários (multi-turno, multi-fuso)
│   ├── faq.js           ← matcher de FAQ por relevância
│   ├── systemPrompt.js  ← prompt gerado a partir do nicho + cliente
│   └── helpers.js
├── models/              ← Client, Lead, Uso
├── routes/              ← webhook, admin
└── views/admin.html     ← painel

docs/comercial/          ← playbook comercial completo
tests/smoke.js           ← teste end-to-end sem rede
```

## Rodando

```bash
npm install
cp .env.example .env     # preencha as chaves
npm test                 # smoke test end-to-end, não precisa de rede
npm start                # painel em http://localhost:3000/admin
```

### Cadastrar um cliente

**Painel:** `/admin` → escolha o nicho → os campos vêm pré-preenchidos → ajuste → salve.

**CLI:** `npm run create-client`

Depois, na Z-API do cliente: webhook `https://seu-servidor/webhook/<clientId>`,
evento `On Message Received`.

⚠️ Após o cadastro, **substitua todos os `[preencher]`** da base de conhecimento e
das FAQs por conteúdo real. Campo `[preencher]` é ignorado pelo bot de propósito —
melhor não responder do que responder um template.

## Custos

Um servidor (VPS 4 vCPU / 8 GB, ~R$ 75/mês) atende **10 clientes** com ~20× de folga —
o limite de 10 é de risco e suporte, não de capacidade.

| Item | Custo | Observação |
|---|---|---|
| IA por mensagem | **R$ 0,006** | com cache ligado; R$ 0,018 sem |
| Canal WhatsApp (WAME API) | R$ 29/cliente | instância dedicada, msgs ilimitadas |
| Servidor | R$ 7,50/cliente | R$ 75 ÷ 10 clientes |

```bash
npm run custos                    # modelo completo, todos os cenários
npm run custos -- --ttl 5m        # comparar TTL de cache
npm run custos -- --cambio 6.20   # estressar o câmbio
```

## Planos

| Plano | Mensal | Implantação | Mensagens | Excedente |
|---|---|---|---|---|
| Essencial | R$ 397 | R$ 697 | 2.500 | R$ 0,35/msg |
| Start | R$ 900 | R$ 1.200 | 3.000 | R$ 0,30/msg |
| Pro | R$ 1.300 | R$ 1.800 | 8.000 | R$ 0,30/msg |
| Enterprise | R$ 2.000 | R$ 2.500 | 20.000 | R$ 0,30/msg |

**O bot nunca bloqueia por limite.** Passou, continua atendendo e o excedente é
contabilizado — a fatura adicional é gerada no dia 1º de cada mês.

```bash
# margens e projeção de carteira a qualquer momento
node -e "const p=require('./src/config/planos');console.table(Object.keys(p.PLANOS).map(id=>({plano:id,...p.getAnaliseFinanceira(id)})))"
```

## Deploy (Render)

1. Suba o repositório (sem `.env`)
2. New Web Service → Build `npm install` → Start `npm start`
3. Configure as variáveis do `.env.example`
4. Health check: `GET /health`
