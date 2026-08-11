# 🤖 Bot SaaS v3 — WhatsApp Multi-Tenant (Claude Edition)

Bot de atendimento inteligente usando **Claude (Anthropic)** + **Z-API** + **MongoDB Atlas**.

> **Modelo de negócio:** Bot de atendimento 24h — recepcionista digital. Não vende no lugar do vendedor. Qualifica leads e direciona para a filial certa.

---

## ✅ Funcionalidades v3.1 (Claude Edition)

| Feature | Descrição |
|---------|-----------|
| **Multi-tenant** | Um servidor, N clientes |
| **Motor de IA** | Claude (Anthropic) |
| **Opera 24h** | Nunca bloqueia. Sempre responde — mesmo acima do limite do plano |
| **Limite de mensagens por plano** | Start 3.000 / Pro 8.000 / Enterprise 20.000 por mês |
| **Excedente sem bloqueio** | Passou do limite? O bot continua respondendo e só CONTA quantas mensagens excederam |
| **Cobrança de excedente automática** | Todo dia 1º, gera fatura adicional do mês anterior (mensagens excedentes × R$ 0,30) |
| **Relatório semanal ao cliente** | Só Pro e Enterprise recebem. Start não recebe |
| **Relatório semanal pra você** | Toda semana, WhatsApp seu com tokens e custo de IA de CADA cliente |
| **Lead → filial individual** | Notificação no WhatsApp da loja escolhida |
| **Botão ASSUMIR** | Vendedor clica no botão no WhatsApp da loja |
| **Alerta de lead não respondido** | Avisa novamente após 30 minutos |
| **FAQ dinâmico** | Respostas imediatas sem custo de IA |
| **Fallback Claude** | Se a API falhar, resposta fixa de contingência |
| **Trial automático** | Campo `trialAte` no cadastro |
| **Painel admin web** | Cadastre clientes, veja leads, estatísticas, uso mensal e análise financeira |
| **Health check** | Endpoint `/health` para monitoramento |

---

## 💰 Análise Financeira por Plano

| Plano | Receita/mês | Msgs | Custo Total* | Lucro | Margem | Excedente |
|-------|-------------|------|--------------|-------|--------|-----------|
| **Start** | R$ 900 | 3.000 | R$ 250 | **R$ 650** | 72,2% | R$ 0,30/msg |
| **Pro** | R$ 1.300 | 8.000 | R$ 415 | **R$ 885** | 68,1% | R$ 0,30/msg |
| **Enterprise** | R$ 2.000 | 20.000 | R$ 811 | **R$ 1.189** | 59,5% | R$ 0,30/msg |

\* Custo = IA Claude (~R$ 0,033/msg) + Z-API (~R$ 75) + Suporte (~R$ 50) + Infra dividida (~R$ 26)

**Lucro por msg excedente:** R$ 0,30 - R$ 0,033 = **R$ 0,27 líquido**

---

## 🚀 Deploy no Render

1. Suba este código para um repositório GitHub (sem o `.env`)
2. Render → New Web Service → Connect GitHub
3. Build: `npm install` | Start: `npm start`
4. Adicione as Environment Variables do `.env.example`

---

## 🔧 Configuração do .env

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/botsaas?retryWrites=true&w=majority
CLAUDE_API_KEY=sk-ant-sua_chave_aqui
CLAUDE_MODEL=claude-sonnet-5
ADMIN_PASSWORD=sua_senha_forte_aqui
PORT=3000
RELATORIO_DIA=0
RELATORIO_HORA=9
OWNER_ZAPI_INSTANCE_ID=
OWNER_ZAPI_TOKEN=
OWNER_WHATSAPP_NUMBER=5545999999999
PRECO_INPUT_TOKEN_1K=0.015
PRECO_OUTPUT_TOKEN_1K=0.075
```

---

## 📋 Cadastrando um cliente novo

### Opção A: Painel Web
1. Acesse `https://seuservidor.onrender.com/admin`
2. Digite a senha do admin
3. Preencha o formulário (limite e preço de excedente preenchem sozinhos ao escolher o plano)
4. Adicione FAQ, filiais, copie o webhook

### Opção B: CLI
```bash
npm run create-client
```

---

## 🔗 Configurando Webhook na Z-API

No painel da Z-API do cliente:
- **Webhook URL**: `https://seuservidor.onrender.com/webhook/ID_DO_CLIENTE`
- **Evento**: `On Message Received`

---

## 🧪 Testes

| Teste | Mensagem/Ação | Resultado Esperado |
|-------|----------|-------------------|
| 1ª vez | `"oi"` | Boas-vindas do bot |
| FAQ | Pergunta cadastrada no FAQ | Resposta imediata, sem custo de IA |
| Anamnese | Pergunta aberta | Bot pergunta e conduz a conversa |
| Escolhe filial | Cliente indica preferência | Detecta `[FILIAL:NUMERO]` |
| Lead pronto | Completa anamnese | Notifica WhatsApp da filial + botão ASSUMIR |
| Pediu humano | `"Quero falar com atendente"` | Notifica filial(is), avisa cliente, bot continua ativo |
| Áudio | Envia áudio | Resposta fixa pedindo texto |
| Fallback Claude | (simular erro na API) | Resposta de contingência |
| **Limite do plano** | Ultrapassar limite mensal | Bot **continua respondendo normalmente**; mensagem é contada como excedente |
| **Fechamento mensal** | Dia 1º do mês | Gera fatura adicional (se houve excedente) e avisa você no WhatsApp |
| **Relatório cliente Start** | Domingo, hora do relatório | Cliente Start **não recebe** relatório |
| **Relatório cliente Pro/Enterprise** | Domingo, hora do relatório | Cliente recebe resumo semanal |
| **Relatório admin** | Domingo, hora do relatório | Você recebe relatório com tokens e custo de cada cliente |
| Botão assumir | Clica "Assumir Atendimento" | Marca lead como em atendimento |

---

*Bot SaaS v3 — Claude Edition — Pronto para escalar 🚀*
