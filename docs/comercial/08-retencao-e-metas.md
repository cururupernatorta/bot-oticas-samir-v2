# 08 — Retenção, upsell e metas

> Em SaaS de ticket médio, **a retenção vale mais que a aquisição**. Um cliente que
> fica 24 meses no Pro vale R$ 31.200. O mesmo cliente cancelando no mês 4 vale
> R$ 7.000 — e você gastou o mesmo esforço para vender.

## O ritual de retenção

| Quando | Ação | Objetivo |
|---|---|---|
| **Dia 7** | Ligação de acompanhamento com os primeiros números | Confirmar que está no ar e funcionando |
| **Dia 30** | Relatório do primeiro mês + **pedido de indicação e depoimento** | Consolidar valor no pico do entusiasmo |
| **Semanal** | Relatório automático no WhatsApp do gestor (Pro/Enterprise) | Lembrar do valor sem esforço |
| **Mensal** | Revisão de conhecimento: promoções, horários, serviços novos | Manter o bot atualizado e útil |
| **Trimestral** | Ligação de 15 min: "o que está bom e o que está incomodando?" | Pegar insatisfação antes que vire cancelamento |
| **Anual** | Renovação + reajuste IPCA + proposta de upgrade | Aumentar LTV |

**Cliente do Essencial não recebe relatório automático.** Compense: mande você
mesmo um resumo curto por WhatsApp no dia 30 de cada mês. Leva 3 minutos e é o
que impede o cancelamento silencioso.

## Sinais de alerta (churn preditivo)

Monitore no painel:

| Sinal | O que significa | Ação |
|---|---|---|
| Queda de mensagens/mês > 30% | Bot pode estar desconectado ou o número mudou | Verificar Z-API hoje |
| Nenhum lead assumido pelo botão em 15 dias | A equipe abandonou o processo | Retreinar a equipe |
| Pedidos de humano acima de 30% das conversas | Base de conhecimento defasada | Revisão de conteúdo |
| Cliente parou de responder suas mensagens | Desengajamento | Ligar — não mande mensagem, ligue |
| Atraso de pagamento pela 2ª vez | Dificuldade financeira ou insatisfação | Conversa direta sobre o plano |

## Upsell — a escada natural

1. **Excedente vira upgrade.** Quem estoura o limite recebe a fatura adicional.
   Mostre a conta: *"Você pagou R$ 350 de excedente. No Start, essas mensagens
   já estariam inclusas e sairia mais barato."* O upgrade se vende sozinho.
2. **Nova unidade** — cada filial nova é motivo de upgrade de plano
3. **Segundo número de WhatsApp** (ex.: um para vendas, outro para pós-venda)
4. **Relatório e reunião de resultados** — do Start para o Pro

## Programa de indicação

Peça no dia 30, com script:

> "[Nome], me ajuda com uma coisa: você conhece outro dono de [nicho] aqui na
> região que passa pelo mesmo problema de mensagem sem resposta? Se você me
> apresentar e fechar, eu te dou um mês grátis."

| Recompensa | Quando |
|---|---|
| 1 mês grátis para quem indicou | Indicado fecha contrato |
| 10% de desconto no primeiro mês para o indicado | Na assinatura |

Indicação tem a maior taxa de conversão do funil inteiro e custo de aquisição
praticamente zero. A partir do mês 6 ela deve responder por 20% das vendas.

---

## Metas — 12 meses

### Metas de resultado

| Trimestre | Clientes novos | Base acumulada | MRR alvo | Foco |
|---|---|---|---|---|
| **T1** (M1–3) | 5 | 5 | R$ 3.000 | Validar o discurso e o onboarding. Só óticas + 1 nicho vizinho |
| **T2** (M4–6) | 10 | 15 | R$ 12.000 | Abrir 2 nichos do Tier A. Fechar 2 parcerias com contadores |
| **T3** (M7–9) | 15 | 30 | R$ 29.000 | Escalar por parceria. Primeiro contrato Enterprise |
| **T4** (M10–12) | 20 | 50 | R$ 51.500 | Consolidar. Contratar 1 pessoa de suporte/onboarding |

### Metas de atividade (o que você controla)

| Indicador | Meta |
|---|---|
| Prospects novos/semana | 50 |
| Abordagens/semana | 30 |
| Demos/semana | 5 |
| Propostas/semana | 3 |
| Fechamentos/mês | 4–5 |
| Churn mensal | < 4% |
| Tempo de onboarding | ≤ 7 dias |
| NPS trimestral | > 50 |

**Meça atividade, não só resultado.** Resultado é consequência atrasada; atividade
é o que você corrige na segunda-feira.

### Quando contratar a primeira pessoa

Ao cruzar **20 clientes ativos** ou quando o onboarding começar a passar de 7 dias.
O primeiro contratado deve ser de **onboarding e suporte**, não de vendas — vendas
é a parte que você faz melhor e que não pode delegar cedo.

## Riscos do negócio (e o plano B)

| Risco | Probabilidade | Mitigação |
|---|---|---|
| **Bloqueio de número pelo WhatsApp** | Média | Não fazer disparo em massa; só responder quem escreveu. Ter caminho de migração para a API oficial em clientes grandes |
| **Aumento de preço da IA** | Baixa | Contrato com reajuste anual; FAQ reduz chamadas; possibilidade de trocar de modelo |
| **Dependência da Z-API** | Média | Camada de envio isolada em `zapiService.js` — trocar de provedor mexe em um arquivo só |
| **Concorrente barateando** | Alta | Diferencial é nicho + entrega local + suporte, não preço. Nunca compita por preço |
| **Cliente âncora sair** | Média | Nenhum cliente pode passar de 20% do MRR |
