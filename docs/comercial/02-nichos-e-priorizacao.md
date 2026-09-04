# 02 — Nichos e priorização

## Como pontuamos um nicho

Nem todo comércio vale a mesma coisa. Seis critérios, nota de 1 a 5:

| Critério | Pergunta |
|---|---|
| **Impacto de 1 lead** | Quanto vale para o cliente um único negócio salvo? |
| **Volume de WhatsApp** | O canal principal dele é WhatsApp? |
| **Dor de horário** | O interesse do consumidor acontece fora do expediente? |
| **Acesso ao decisor** | Dá para falar com quem assina em 1 ou 2 toques? |
| **Ciclo de venda** | Fecha em dias ou em meses? |
| **Risco de compliance** | Quanto o setor é regulado / sensível? (aqui, menos é melhor) |

Regra de ouro: **impacto de 1 lead** é o critério que mais move a decisão de compra.
Uma imobiliária que salva um lead paga o sistema por 12 meses. Uma barbearia
precisa salvar 20 agendamentos para justificar o mesmo valor.

---

## Matriz de priorização

### 🥇 Tier A — atacar primeiro (ticket alto, decisão rápida)

| Nicho | Impacto de 1 lead | Plano | Argumento de entrada |
|---|---|---|---|
| **Imobiliárias e corretores** | R$ 3.000 – R$ 30.000 de comissão | Enterprise | "Quanto custa seu lead de portal? Quantos são respondidos em menos de 5 minutos?" |
| **Móveis planejados / decoração** | R$ 8.000 – R$ 60.000 de projeto | Pro | "Um único projeto salvo paga o sistema por dois anos." |
| **Clínicas odontológicas** | R$ 1.500 – R$ 15.000 de tratamento | Pro | "Cada buraco na agenda de amanhã provavelmente é uma mensagem de ontem à noite." |
| **Clínicas de estética** | R$ 800 – R$ 8.000 em pacotes | Pro | "Você paga por cada lead de anúncio. Quanto tempo ele espera resposta?" |
| **Materiais de construção** | R$ 500 – R$ 20.000 por orçamento | Pro | "Pedreiro manda lista de material domingo à noite. Vocês respondem quando?" |
| **Óticas** | R$ 350 – R$ 2.500 | Pro | O bot já está afinado para o setor — mas sem case, ver a ressalva abaixo |

> ⛔ **Óticas estão fora da lista por enquanto.** Você trabalha nas Óticas Samir.
> Vender atendimento automatizado para ótica concorrente na mesma região é motivo
> de justa causa e pode configurar concorrência desleal. Elas voltam para a mesa
> quando você sair de lá, ou com autorização expressa do dono. Ver
> **[documento 00](00-comecar-sem-case.md)** → "Antes de vender qualquer coisa".

> ⚠️ **E esta ordem só vale depois do primeiro case.** Ticket alto compra de quem
> tem referência: imobiliária, clínica e planejados vão perguntar quem já usa, e
> hoje a resposta é "ninguém". Enquanto não houver prova, a prioridade **inverte** —
> rede quente antes de nicho, e negócio simples antes de ticket alto. Ver
> **[documento 00](00-comecar-sem-case.md)**.

### 🥈 Tier B — bom volume, esforço médio

| Nicho | Plano | Observação |
|---|---|---|
| **Academias e estúdios** | Pro | Pico de interesse é domingo à noite — argumento pronto |
| **Escolas e cursos** | Pro | Sazonal: venda 60 dias antes da janela de matrícula |
| **Oficinas e autocenters** | Essencial | Todo mundo com a mão suja; ninguém atende WhatsApp |
| **Pet shops e banho e tosa** | Essencial | Sábado é o dia de mais mensagem e menos gente livre |

### 🥉 Tier C — cuidado, mas vendável

| Nicho | Por que ter cuidado | Como vender mesmo assim |
|---|---|---|
| **Salões e barbearias** | Ticket baixo, alta rotatividade | Só no Essencial; venda em bloco via distribuidor de produtos |
| **Restaurantes e delivery** | Volume altíssimo = custo de IA alto | Só Enterprise; nunca deixe no Pro |
| **Advocacia e contabilidade** | Código de Ética da OAB restringe captação | Posicione como triagem e agendamento, nunca como captação |
| **Assistência técnica** | Ticket baixo | Ótimo para volume e indicação; margem via Essencial |

### ⛔ Evitar por enquanto

- **Óticas da sua região** — conflito direto com seu emprego atual (ver acima)
- **Farmácias e qualquer coisa que toque prescrição** — risco regulatório alto
- **Financeiro / crédito / consórcio** — regulação Bacen, risco de promessa indevida
- **Saúde com telemedicina** — exige conformidade que ainda não temos
- **Negócio sem WhatsApp como canal principal** — não há dor

---

## Estratégia de concentração geográfica

Não pulverize. A sequência que funciona:

1. **Domine um nicho na sua cidade** — o do seu primeiro case, qualquer que ele seja
2. **Expanda o mesmo nicho para cidades vizinhas** — o argumento já está pronto,
   a referência é da região, e não há conflito de concorrência direta
3. **Só então abra um segundo nicho na cidade de origem**

Vender ótica em Foz e ótica em Cascavel é fácil: não competem entre si e a
referência local pesa. Vender ótica e pet shop ao mesmo tempo dobra seu trabalho
de aprendizado sem dobrar a receita.

**Regra prática:** só abra nicho novo depois de 3 clientes pagantes no nicho atual.

---

## Como criar um nicho novo

Quando um prospect fora da lista aparecer com bom potencial:

1. Copie `src/config/nichos/generico.js` para `src/config/nichos/<novo>.js`
2. Preencha: vocabulário, objetivo, roteiro de qualificação, **limites de
   compliance do setor**, FAQ inicial, KPIs, dados comerciais
3. Rode `npm run smoke` — o teste valida que o novo pacote gera prompt completo
4. Ele aparece sozinho no painel e no CLI

Tempo real: 30 a 45 minutos. Faça isso **antes** da reunião de demonstração e
apresente o bot já falando a língua do prospect. Fecha muito mais.
