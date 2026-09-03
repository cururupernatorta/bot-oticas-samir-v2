# 03 — Precificação e unit economics

## Grade de planos

| Plano | Mensal | Implantação | Mensagens/mês | Excedente | Público |
|---|---|---|---|---|---|
| **Essencial** | R$ 397 | R$ 697 | 2.500 | R$ 0,35/msg | 1 unidade, negócio local pequeno |
| **Start** | R$ 900 | R$ 1.200 | 3.000 | R$ 0,30/msg | Até 3 unidades |
| **Pro** | R$ 1.300 | R$ 1.800 | 8.000 | R$ 0,30/msg | Rede ou quem investe em anúncio |
| **Enterprise** | R$ 2.000 | R$ 2.500 | 20.000 | R$ 0,30/msg | Alto volume |

Fonte de verdade no código: `src/config/planos.js`. O painel lê de lá — mudou o
plano no código, mudou em todo lugar.

### Por que existe o plano Essencial

O piso de R$ 900 fechava a porta para barbearia, pet shop, oficina e assistência
técnica — que são os negócios **mais fáceis de fechar** e a **melhor fonte de
indicação boca a boca**. O Essencial abre esse mercado e ainda dá 47% de margem
no pior caso, porque o custo variável de IA é baixo.

Ele também funciona como degrau: quem estoura o limite recebe fatura de excedente
e o próprio relatório mostra que o Start sai mais barato. O upgrade se vende sozinho.

### Por que NUNCA zerar a implantação

A taxa paga as 4 a 8 horas reais de onboarding (ficha, base de conhecimento,
testes, treinamento da equipe) e — mais importante — **filtra curioso**. Cliente
que não paga implantação não preenche a ficha, não treina a equipe e cancela em
60 dias, deixando você no prejuízo.

Se precisar de flexibilidade, parcele em 2 ou 3 vezes. Nunca zere.

---

## Estrutura de custo por cliente

| Item | Valor | Natureza |
|---|---|---|
| IA (Claude) | ~R$ 0,033/mensagem | Variável |
| Z-API (1 instância) | ~R$ 75/mês | Fixo por cliente |
| Suporte humano | R$ 25 – R$ 60/mês | Fixo por cliente, varia com o plano |
| Infra (Render + Mongo + domínio) | ~R$ 130/mês **no total** | Fixo, rateado entre todos |

O rateio de infra é o que faz a margem melhorar sozinha com escala: com 5 clientes
são R$ 26 cada; com 20 clientes, R$ 6,50.

**Como a plataforma reduz o custo de IA:** FAQ e saudações são respondidos sem
chamar o modelo. Numa operação típica isso corta 25% a 40% das chamadas — o que
aparece direto na margem.

## Margem por plano

Pior caso = cliente consome 100% do limite. Uso real = 60% do limite, 20 clientes na base.

| Plano | Lucro (pior caso) | Margem | Lucro (uso real) | Margem real |
|---|---|---|---|---|
| Essencial | R$ 188,50 | 47,5% | R$ 241,00 | 60,7% |
| Start | R$ 660,00 | 73,3% | R$ 719,10 | 79,9% |
| Pro | R$ 885,00 | 68,1% | R$ 1.010,10 | 77,7% |
| Enterprise | R$ 1.179,00 | 59,0% | R$ 1.462,50 | 73,1% |

Lucro líquido por mensagem excedente: **R$ 0,27**.

Reproduza esses números a qualquer momento:

```bash
node -e "const p=require('./src/config/planos'); console.table(Object.keys(p.PLANOS).map(id=>({plano:id,...p.getAnaliseFinanceira(id)})))"
```

---

## Projeção de carteira — 12 meses

| Marco | Mix de clientes | Clientes | MRR | Custo | **Lucro/mês** | Margem |
|---|---|---|---|---|---|---|
| Mês 3 | 3 Essencial + 2 Start | 5 | R$ 2.991 | R$ 1.007 | **R$ 1.985** | 66% |
| Mês 6 | 6 Ess + 5 Start + 4 Pro | 15 | R$ 12.082 | R$ 3.653 | **R$ 8.429** | 70% |
| Mês 9 | 10 Ess + 8 Start + 9 Pro + 3 Ent | 30 | R$ 28.870 | R$ 9.223 | **R$ 19.647** | 68% |
| Mês 12 | 15 Ess + 12 Start + 16 Pro + 7 Ent | 50 | R$ 51.555 | R$ 17.225 | **R$ 34.331** | 67% |

Fora isso, as taxas de implantação somam de R$ 40 mil a R$ 70 mil no ano — é o
caixa que financia o crescimento.

> ⚠️ **Não conte com esses números como certos.** São a matemática do modelo com
> a taxa de conversão que você ainda vai medir. Refaça a projeção no mês 3 com
> dados reais de conversão e churn.

---

## Regras de negociação

**Pode:**
- Parcelar a implantação em até 3x
- Dar 1 mês grátis em contrato anual pago à vista
- Desconto de 10% no anual (com fidelidade de 12 meses em contrato)
- Preço promocional para os **3 primeiros clientes de um nicho novo**, em troca
  de depoimento em vídeo e permissão de uso do nome — deixe explícito que é
  condição de lançamento e por tempo determinado

**Não pode:**
- Zerar implantação
- Descer abaixo de R$ 397/mês
- Vender Pro para restaurante/delivery (o volume come a margem — é Enterprise)
- Prometer volume de vendas ou faturamento

## Reajuste

Contrato com reajuste anual pelo IPCA, escrito desde o primeiro contrato. Sem essa
cláusula, a margem derrete em dois anos e reabrir a conversa de preço depois é
muito mais caro do que já ter deixado combinado.
