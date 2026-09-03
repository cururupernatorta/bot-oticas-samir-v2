# Playbook Comercial — Atende24

> Plataforma de atendimento automatizado 24h no WhatsApp, vendida como serviço
> mensal para comércios e prestadores de serviço locais.

Este playbook transforma o sistema construído para as **Óticas Samir** em um
produto vendável para qualquer nicho, sem reescrever o código para cada cliente.

> ⚠️ **Comece pelo [documento 00](00-comecar-sem-case.md).** O sistema ainda não
> foi implantado em lugar nenhum e as Óticas Samir não seguiram adiante — ou seja,
> **não existe case**. Os documentos 01 a 10 assumem que existe um. O documento 00
> corrige a rota e é o que vale até o primeiro cliente estar no ar.

---

## Resumo executivo

| Item | Definição |
|---|---|
| **O que é** | Recepcionista digital que atende o WhatsApp da empresa 24h, responde dúvidas, qualifica o interesse e entrega o cliente pronto para o vendedor |
| **O que NÃO é** | Não é vendedor, não fecha negócio, não substitui equipe. Isso é proposital — e é o que faz o dono comprar sem medo |
| **Modelo** | SaaS mensal + taxa de implantação. Multi-tenant: um servidor, N clientes |
| **Ticket** | R$ 397 a R$ 2.000/mês + R$ 697 a R$ 2.500 de implantação |
| **Margem** | 47% a 73% no pior caso; 60% a 80% no uso real |
| **Meta 12 meses** | 50 clientes · R$ 51,5 mil de MRR · R$ 34 mil de lucro mensal |
| **Diferencial defensável** | Pacotes de nicho: o bot já nasce sabendo falar como ótica, clínica, pet shop ou imobiliária — inclusive o que ele **não** pode dizer |
| **Estágio hoje** | Produto pronto e testado, **zero clientes**. A prioridade é conseguir os 3 primeiros (documento 00) |

---

## Índice

| # | Documento | Para quê |
|---|---|---|
| **00** | **[Começar sem case](00-comecar-sem-case.md)** | **Leia primeiro: como conseguir o cliente nº 1 sem prova social** |
| 01 | [Produto e posicionamento](01-produto-e-posicionamento.md) | O que vendemos, para quem, e a promessa exata |
| 02 | [Nichos e priorização](02-nichos-e-priorizacao.md) | Onde atacar primeiro e por quê |
| 03 | [Precificação e unit economics](03-precificacao-e-unit-economics.md) | Planos, margens, projeção de carteira |
| 04 | [Máquina de prospecção](04-prospeccao.md) | Como gerar reuniões todos os dias |
| 05 | [Scripts e objeções](05-scripts-e-objecoes.md) | O que falar, palavra por palavra |
| 06 | [Marketing e conteúdo](06-marketing-e-conteudo.md) | Presença, prova social, anúncio, parcerias |
| 07 | [Onboarding e entrega](07-onboarding-e-entrega.md) | Do contrato ao go-live em 7 dias |
| 08 | [Retenção, upsell e metas](08-retencao-e-metas.md) | Como não perder cliente e crescer dentro da base |
| 09 | [Contrato, LGPD e riscos](09-contrato-lgpd-e-riscos.md) | O que precisa estar no papel |
| 10 | [Plano de 90 dias](10-plano-90-dias.md) | O que fazer amanhã de manhã |
| — | [Ficha de diagnóstico](ficha-diagnostico.md) | Formulário de descoberta e onboarding |
| — | [Modelo de proposta](proposta-comercial-modelo.md) | Proposta pronta para preencher |

---

## Como o produto se customiza sem virar projeto

Cada nicho é um **pacote** em `src/config/nichos/`. O pacote define:

- **Vocabulário** — "paciente" numa clínica, "tutor" num pet shop, "aluno" numa academia
- **Objetivo do atendimento** — agendar, orçar, encaminhar para visita
- **Roteiro de qualificação** — o que o bot precisa descobrir antes de passar para o humano
- **Guardrails de compliance** — o que o bot é *proibido* de dizer naquele setor
- **FAQ inicial** — as perguntas que sempre chegam naquele segmento
- **KPIs** — o que mostrar no relatório para o cliente perceber valor

Criar um nicho novo é copiar um arquivo e ajustar os campos. Ele aparece
automaticamente no painel de cadastro e no CLI de onboarding.

**Consequência comercial:** você monta o bot funcional de um prospect em ~20 minutos,
ao vivo, na reunião. Nenhum concorrente de agência consegue fazer isso na frente dele.
