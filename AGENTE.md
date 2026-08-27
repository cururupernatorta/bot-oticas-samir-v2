# 🤖 Agente de Aquisição

Agente que roda sozinho para **gerar demanda do bot SaaS**: descobre comércios
locais, qualifica quem tem a dor que o produto resolve, escreve a abordagem e
gerencia a cadência de follow-up.

## Por que não é um bot que dá lances no Upwork

A ideia intuitiva — um agente que se cadastra numa plataforma de freelance e
disputa vagas sozinho — não funciona, por três motivos concretos:

| Plataforma | Regra |
|---|---|
| **Upwork** | Define bot como "qualquer script que age mais rápido que um humano". Envio automatizado de proposta é banível. IA só é permitida para rascunhar, com humano clicando em enviar. |
| **Fiverr** | Permite IA na entrega, mas exige julgamento humano em toda ordem. |
| **Workana / 99Freelas** | Sem API pública. Automação = scraping do painel. |

Além da regra, a economia é ruim: comissão de ~20%, disputa por preço com o
mundo inteiro, e a conta é sua — um ban leva junto todo o histórico.

**Este agente inverte a direção.** Em vez de disputar vaga em plataforma de
terceiro, ele vende o produto que você já tem, no seu canal, para clientes que
você descobre. Sem comissão, sem ToS de terceiro, sem risco de ban da conta.

---

## Como funciona

```
   descobrir ──> qualificar ──> escrever ──> [VOCÊ APROVA] ──> enviar ──> follow-up
   OpenStreetMap  heurística     Claude        fila admin       Z-API     4 toques
   (grátis)       + Claude                                                 e para
```

Cada estágio é isolado: se a descoberta cair, a qualificação do que já existe
continua. O trabalho caro (LLM) só acontece sobre o que passou no filtro barato.

### 1. Descoberta — `prospector.js`
Busca empresas na **Overpass API (OpenStreetMap)**. Escolha deliberada: sem API
key, sem cartão, sem cota paga, e o dado é público e comercial — telefone que a
própria empresa publicou. Google Places dá mais sinal (avaliações), mas exige
billing; o adapter pode ser plugado depois sem mexer no resto do pipeline.

### 2. Qualificação — `qualifier.js`
Score 0–100 **determinístico** primeiro, LLM depois. Heurística não alucina e
custa zero; chamar Claude para pontuar 200 prospects é caro e dá nota diferente
a cada rodada. O modelo só entra nos sobreviventes, e não para dar nota — para
achar o **gancho**: o motivo específico daquela empresa querer conversar.

Sinais que aumentam o score:
- Nicho com alto volume de mensagens (clínica, odonto, ótica)
- WhatsApp já declarado como canal
- Horário limitado → muitas horas/semana sem ninguém respondendo
- Sem site → o WhatsApp *é* a porta de entrada

### 3. Redação — `mensageiro.js`
A primeira mensagem **não vende**. Ela entrega um diagnóstico específico.
"Oi, quer um bot?" tem resposta perto de zero. "Reparei que vocês fecham 18h e
o WhatsApp é o canal principal de vocês" abre conversa.

### 4. Aprovação — `outreach.js`
No modo `manual` (padrão), o agente escreve e **para**. Você revisa em
`/api/agente/fila` e aprova. O modo `auto` existe, mas só ligue depois de ~50
aprovações manuais, quando você já souber como ele escreve.

### 5. Follow-up — cadência de 4 toques
Dia 0 diagnóstico → dia 3 prova social → dia 7 oferta de teste → dia 14
encerramento. **Para imediatamente** se a pessoa responder ou pedir para sair.

---

## Guardrails — `compliance.js`

Prospecção B2B no Brasil se apoia no **legítimo interesse** (LGPD art. 7º, IX),
que não exige consentimento prévio, mas exige finalidade, necessidade e
balanceamento. A ANPD fiscaliza ativamente desde 2025 e a multa chega a 2% do
faturamento (teto R$ 50 mi). Estes freios são mecânicos, não recomendações:

| Trava | Efeito |
|---|---|
| **Opt-out permanente** | "SAIR" (ou 20 variações) bloqueia o número para sempre |
| **Janela de contato** | Seg–sex, 9h–18h, horário de São Paulo. Nunca madrugada ou fim de semana |
| **Limite diário/horário** | 20/dia e 5/hora por padrão |
| **Intervalo entre envios** | 90s — cadência humana, não rajada |
| **Rodapé obrigatório** | Toda mensagem oferece saída explícita |
| **Trilha de auditoria** | Todo envio, bloqueio e opt-out gravado com data |
| **Falha fecha o portão** | Erro na verificação bloqueia o envio, nunca libera |

`podeContatar()` é o único caminho de saída e **não tem bypass** — nem aprovação
manual pula o opt-out ou a janela de contato.

> ⚠️ Use uma instância Z-API **dedicada** à prospecção. Se o número for
> denunciado, você perde a prospecção — não a operação que atende clientes pagantes.

---

## Uso

```bash
cp .env.example .env      # preencha as chaves
npm install
npm test                  # 63 testes, sem rede e sem Mongo

npm run agente funil      # números do funil
npm run agente prospectar # só descoberta
npm run agente qualificar # só qualificação
npm run agente ciclo      # ciclo completo
npm run agente fila       # o que espera aprovação
```

Com o servidor rodando (`npm start`), o agente também expõe:

| Rota | O quê |
|---|---|
| `GET  /api/agente/status` | Modo, funil, últimos ciclos |
| `GET  /api/agente/fila` | Mensagens aguardando aprovação |
| `POST /api/agente/aprovar/:chave` | Aprova e envia uma |
| `POST /api/agente/rejeitar/:chave` | Descarta uma |
| `POST /api/agente/aprovar-lote` | Despacha a fila respeitando os limites |
| `POST /api/agente/ciclo` | Dispara um ciclo manualmente |
| `POST /api/agente/optout` | Registra opt-out pedido por outro canal |
| `GET  /api/agente/auditoria` | Trilha completa |

Todas exigem `?password=$ADMIN_PASSWORD`.

### Ligando o modo autônomo

```env
AGENTE_ATIVO=true     # liga o cron (a cada 2h, dias úteis, 9h–17h)
AGENTE_MODO=manual    # troque para 'auto' só depois de confiar na escrita dele
```

---

## Estado atual

Testado: 63 testes cobrindo normalização de telefone, extração de dados do OSM,
score de qualificação, detecção de opt-out, conversão de fuso, formatação de
proposta e wiring das rotas.

Não testado end-to-end: a chamada real à Overpass, ao Claude e à Z-API exigem
rede e credenciais. A lógica em volta delas está coberta.

**Antes de ligar em produção:** rode `npm run agente ciclo` com
`AGENTE_MODO=manual` e leia as primeiras 20 mensagens que ele escrever. O custo
de uma mensagem ruim é o número denunciado.
