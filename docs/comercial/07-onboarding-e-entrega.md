# 07 — Onboarding e entrega

> Onboarding ruim é a causa nº 1 de churn em SaaS de pequeno negócio. O cliente
> não cancela porque o produto é ruim — cancela porque nunca chegou a usar direito.

## Cronograma de 7 dias

| Dia | Responsável | Atividade | Entrega |
|---|---|---|---|
| **D0** | Você | Contrato assinado + cobrança da implantação + envio da ficha | Contrato + ficha enviada |
| **D1** | Cliente | Devolve a ficha preenchida | Ficha completa |
| **D1** | Você | Cria instância Z-API, conecta o número, cadastra o cliente no painel | Webhook ativo |
| **D2** | Você | Preenche base de conhecimento, FAQ, unidades e horários | Bot configurado |
| **D3** | Você | Bateria de testes internos (roteiro abaixo) | Checklist aprovado |
| **D4** | Ambos | Piloto: o dono e 2 funcionários conversam com o bot como se fossem clientes | Ajustes de tom e conteúdo |
| **D5** | Você | Ajustes finais + treinamento da equipe (30 min) | Equipe treinada |
| **D6** | — | **Go-live** com o número real | Bot no ar |
| **D7** | Você | Ligação de acompanhamento + primeiros números | Cliente vendo valor |

**Nunca vá ao ar sem o D4.** O piloto com o dono é o que evita o cancelamento no
mês 2: ele precisa ver o bot errando pequeno e você corrigindo na frente dele.

## Checklist técnico de go-live

```
[ ] Instância Z-API conectada e webhook apontando para /webhook/<clientId>
[ ] Cliente cadastrado com o nicho correto
[ ] Todos os campos [preencher] do conhecimento substituídos por conteúdo real
[ ] Todas as FAQ com resposta real (nenhuma com [preencher])
[ ] Unidades com endereço, WhatsApp e horários corretos
[ ] Fuso horário correto (atenção a MT, MS, AM, AC)
[ ] WhatsApp do gestor cadastrado para o relatório semanal
[ ] Plano, limite e preço de excedente conferidos
[ ] Teste: saudação
[ ] Teste: pergunta de FAQ → resposta instantânea
[ ] Teste: pergunta aberta → IA responde no tom certo
[ ] Teste: escolha de unidade → roteamento correto
[ ] Teste: qualificação completa → lead chega no WhatsApp da unidade
[ ] Teste: botão "Assumir atendimento" funciona
[ ] Teste: "quero falar com um atendente" → aciona humano
[ ] Teste: pergunta proibida do nicho → bot recusa corretamente
[ ] Teste: áudio e imagem → resposta pedindo texto
[ ] Teste: fora do horário → aviso correto de reabertura
[ ] Equipe treinada e ciente do botão Assumir
```

## Treinamento da equipe (30 minutos, obrigatório)

O time do cliente precisa entender 4 coisas:

1. **O bot não vai tomar o lugar de ninguém.** Ele filtra e prepara.
2. **Quando chegar o alerta, clique em "Assumir atendimento".** É isso que registra
   quem pegou o caso e para o alerta de cobrança.
3. **Responda rápido.** O sistema avisa de novo em 30 min se ninguém assumir, e
   avisa uma segunda vez depois disso.
4. **Reclamou de algo que o bot falou? Me avisa direto.** Ajuste em 24h.

Peça para o dono estar nessa reunião. Sem o dono, a equipe não adota.

## Manutenção — o que está incluso no mensal

| Plano | Revisões de conhecimento | Suporte |
|---|---|---|
| Essencial | Sob demanda, até 1x/mês | WhatsApp, horário comercial |
| Start | Sob demanda | WhatsApp, horário comercial |
| Pro | Revisão mensal proativa | WhatsApp, prioridade |
| Enterprise | Revisão mensal + reunião de resultados | Prioridade máxima |

**Ajuste de conhecimento não é escopo extra** (promoção nova, mudança de horário,
serviço novo). Faça no mesmo dia — é o que segura o cliente.

**É escopo extra:** nova unidade além do limite do plano, integração com sistema
externo, segundo número de WhatsApp.

## Sinais de que o onboarding falhou

Se no dia 15 alguma destas for verdade, intervenha imediatamente:

- Nenhum lead foi assumido pelo botão → a equipe não foi treinada ou não comprou a ideia
- Mais de 30% das mensagens caindo em `[HUMANO]` → base de conhecimento incompleta
- O dono não abriu o painel nenhuma vez → ele não está vendo valor; ligue e mostre você
