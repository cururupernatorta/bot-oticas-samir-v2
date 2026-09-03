# 09 — Contrato, LGPD e riscos

> ⚠️ Este documento organiza os pontos que precisam estar cobertos. **Ele não é
> parecer jurídico.** Antes do primeiro contrato assinado, leve o modelo a um
> advogado — o custo é baixo e evita problema caro depois.

## Cláusulas que o contrato precisa ter

| Cláusula | Conteúdo essencial |
|---|---|
| **Objeto** | Licença de uso de plataforma de atendimento automatizado em regime SaaS. Não é desenvolvimento de software sob encomenda — o código é seu |
| **Vigência** | 12 meses, renovação automática, aviso prévio de 30 dias para não renovar |
| **Valores** | Implantação (à vista ou parcelada) + mensalidade + regra de excedente por mensagem |
| **Reajuste** | Anual pelo IPCA |
| **Escopo incluso** | Configuração inicial, ajustes de conhecimento, suporte no horário comercial |
| **Escopo extra** | Unidades acima do limite, integrações, número adicional — orçados à parte |
| **SLA** | Disponibilidade alvo de 99% mensal, excluídas janelas de manutenção e indisponibilidade de terceiros (WhatsApp, Z-API, provedor de IA) |
| **Propriedade intelectual** | O software e os pacotes de nicho são seus. A base de conhecimento e os dados são do cliente |
| **Confidencialidade** | Mútua |
| **Limitação de responsabilidade** | Limitada ao valor pago nos últimos 12 meses. **Exclusão expressa de responsabilidade por lucros cessantes e por conteúdo gerado automaticamente** |
| **Rescisão** | Multa proporcional se antes de 12 meses; devolução de dados em 30 dias |
| **Proteção de dados** | Anexo LGPD (abaixo) |

## O ponto mais importante: responsabilidade sobre o que o bot diz

Deixe no contrato, com todas as letras:

> O sistema utiliza inteligência artificial e pode, eventualmente, gerar resposta
> imprecisa. O CONTRATANTE é responsável pela veracidade das informações que
> fornece para a base de conhecimento e reconhece que o atendimento automatizado
> é meio auxiliar, não substituindo a conferência humana em decisões comerciais,
> técnicas, clínicas ou jurídicas.

E do seu lado, entregue o que reduz esse risco de verdade: as regras de
compliance por nicho, a recusa em dar preço/prazo não cadastrado, e o
encaminhamento para humano em caso de dúvida. Isso já está no produto.

## LGPD — o essencial

Na relação com o cliente:

- **Ele é o Controlador** dos dados dos consumidores dele
- **Você é o Operador** — trata os dados por conta e ordem dele

O anexo de proteção de dados precisa cobrir:

| Item | Definição |
|---|---|
| **Finalidade** | Atendimento automatizado e encaminhamento de oportunidade comercial |
| **Dados tratados** | Telefone, conteúdo das mensagens, horário, unidade escolhida |
| **Base legal** | Execução de contrato / legítimo interesse do controlador |
| **Retenção** | Histórico de conversa por 12 meses; depois, exclusão ou anonimização |
| **Subprocessadores** | Anthropic (IA), Z-API (canal), MongoDB Atlas (banco), Render (hospedagem) — listados nominalmente |
| **Transferência internacional** | Sim (servidores fora do Brasil) — precisa estar declarado |
| **Direitos do titular** | Prazo e canal para atender pedidos de acesso e exclusão |
| **Incidentes** | Notificação ao controlador em até 24h da ciência |

### Regras práticas já embutidas no produto

- O bot **nunca pede** CPF, cartão, senha ou dado bancário
- O bot **não coleta** dado sensível de saúde detalhado (nicho odontologia e estética)
- O bot **se identifica como assistente virtual** quando perguntado — isso não é
  só boa prática, é o que evita problema com o Código de Defesa do Consumidor

### Aviso de bot ao consumidor

Recomende ao cliente incluir na descrição do WhatsApp Business:
> "Atendimento inicial automatizado. Nossa equipe assume quando necessário."

Transparência aqui reduz atrito com o consumidor e blinda o seu cliente.

## Riscos específicos — seja honesto na venda

### 1. Bloqueio do número pelo WhatsApp

A Z-API conecta via WhatsApp Web, que **não é a API oficial**. O risco de bloqueio
existe e vem principalmente de: disparo em massa, mensagens para quem não iniciou
a conversa, e alto índice de bloqueio pelos destinatários.

**O produto reduz o risco por construção:** só responde quem escreveu primeiro,
não faz disparo ativo, e responde em ritmo humano.

**Nunca prometa "impossível bloquear".** Diga a verdade: o risco é baixo no uso
que fazemos, e para clientes grandes existe o caminho da API oficial do WhatsApp
(Cloud API), que custa mais e tem outras regras.

### 2. Indisponibilidade de terceiros

Você depende de WhatsApp, Z-API, provedor de IA e hospedagem. O SLA de 99% deve
excluir explicitamente a indisponibilidade desses fornecedores, ou você assume um
risco que não controla.

### 3. Setores regulados

- **Advocacia:** o Código de Ética da OAB restringe captação e publicidade. Posicione
  como triagem e agendamento. Nunca como "geração de clientes".
- **Saúde:** conselhos profissionais (CFO, CFM, CRO) têm regras sobre publicidade e
  promessa de resultado. Os guardrails do pacote de nicho já bloqueiam diagnóstico
  e promessa — mantenha assim.

## Faturamento e cobrança

- Emita nota fiscal de serviço todo mês (CNPJ obrigatório; Simples Nacional resolve no começo)
- Cobrança recorrente por boleto/Pix automático via gateway — evite cobrar manualmente
- Excedente do mês anterior entra na fatura seguinte, com o detalhamento que o
  sistema gera no dia 1º
- Régua de inadimplência: D+3 lembrete, D+7 ligação, D+15 aviso de suspensão,
  D+30 suspensão. **Avise sempre antes de suspender** — nunca desligue o bot de
  surpresa: quem sofre é o consumidor final do seu cliente
