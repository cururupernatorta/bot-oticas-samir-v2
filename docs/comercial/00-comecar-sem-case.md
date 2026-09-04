# 00 — Começar sem case

> **Leia este documento antes de todos os outros.** O restante do playbook foi
> escrito assumindo que existiria um case nas Óticas Samir. Não existe. Este
> documento corrige a rota e vale mais que os outros até você ter o primeiro
> cliente no ar.

---

## O que muda quando você não tem case

Sem prova social você perde o direito de fazer **afirmações**. E só isso.

| O que você não pode mais fazer | O que você faz no lugar |
|---|---|
| "Funciona — olha esse cliente aqui" | **Demonstrar**: o bot dele, com o nome dele, agora |
| "Já resolvi isso para uma rede da região" | **Assumir o risco**: se não funcionar, você não paga |
| Mostrar números de outro cliente | **Mostrar os números dele**: o Teste do Fantasma |

Afirmação, demonstração e risco assumido são três formas de vencer a mesma
objeção — "por que eu acreditaria em você?". Você perdeu a primeira. As outras
duas continuam inteiras, e a segunda é a mais forte das três.

---

## Os cinco ativos que você tem hoje

Nenhum deles depende de histórico.

**1. O produto existe e funciona.**
Não é protótipo, não é slide, não é promessa. Está rodando, tem teste
automatizado e tem 15 nichos configurados. Isso é raro — a maioria de quem vende
"IA para WhatsApp" está vendendo intenção.

**2. O Teste do Fantasma.**
É a prova mais forte do playbook e **não fala de você**. Fala do prospect. Você
manda uma pergunta às 21h40 de sexta e mostra a ele que a resposta chegou na
segunda às 9h12. Nenhum case é necessário para isso funcionar — a evidência é
sobre a empresa dele, verificável por ele, no celular dele.

**3. A demonstração em 20 minutos.**
Os pacotes de nicho existem exatamente para isso. `npm run demo` monta o bot do
prospect com o nome da empresa dele, o vocabulário do setor dele e as regras de
compliance dele. Você entrega seu celular na mão dele e pede: *"pergunta aí, como
se fosse cliente"*.

Isso não é um substituto pobre do case. Em venda para comércio local, **ver
funcionando com o próprio nome na tela vence um depoimento de terceiro** — porque
o dono não precisa acreditar em você, ele está vendo.

**4. O seu próprio WhatsApp.**
Custa zero e é a prova mais rápida que você pode montar. Ver a seção seguinte.

**5. Você trabalha dentro de um comércio do setor.**
Isso é raro e é subestimado. Você vê o WhatsApp de uma loja real funcionando todo
dia, pode medir o problema com números de verdade antes de falar com qualquer
prospect, e tem salário — o que significa que a fase zero não precisa dar
resultado no mês 1. Também traz um conflito a resolver: ver a seção
"Antes de vender qualquer coisa".

---

## Fase 0 — Semana 1: vire o seu próprio cliente

**Coloque o bot no seu WhatsApp comercial.** Hoje.

Isso resolve três coisas de uma vez:

1. **Vira prova verificável.** Quando o prospect te manda mensagem às 23h e é
   atendido em 5 segundos, ele viveu o produto. Você pode dizer, com verdade:
   *"esse número é o meu, quem te respondeu ontem à noite foi o sistema."*
2. **Você descobre os problemas antes do cliente.** Todo defeito de onboarding
   que existir, você sente primeiro na própria pele.
3. **É o teste de coerência.** Vender atendimento 24h com um WhatsApp que não
   responde à noite é o fim da credibilidade antes de começar.

Configure com o nicho `generico`, seu próprio nome, e as perguntas que prospects
fazem: preço, prazo de implantação, se funciona para o nicho dele.

**Custo: uma instância WAME (R$ 29) e ~R$ 7 de IA por mês.**

---

## Fase 0.5 — Você trabalha lá. Isso muda tudo.

A Samir não é um prospect. É onde você trabalha. Isso significa que a maior parte
do que se escreve sobre "primeira venda" não se aplica a você — para melhor e
para pior.

### Por que eles não parecem interessados (provavelmente não é o produto)

Vender para o próprio empregador é a venda mais difícil que existe, e o motivo
raramente é o produto:

- **Você não é fornecedor, é o funcionário.** A mesma proposta vinda de uma
  empresa de fora teria outro peso. É o santo de casa que não faz milagre, e é
  quase universal.
- **Ninguém quer ser cobaia de um projeto do funcionário.** Se der errado, o
  problema é da loja; se der certo, o funcionário vai embora vender para os outros.
  O dono sente isso mesmo sem verbalizar.
- **Eles não estão avaliando um produto. Estão avaliando um pedido seu.** É
  diferente, e por isso a resposta é morna em vez de um "não" com motivo.

Repare que nada disso é sobre o bot funcionar ou não.

### Pare de pedir para comprar. Peça para testar.

**Esta é a mudança mais importante do plano inteiro.**

Você vinha fazendo uma pergunta de compra: orçamento, decisão, contrato, risco.
Troque por uma pergunta de experimento:

> "Deixa eu ligar isso em **uma filial só**, por 30 dias, sem custo nenhum pra
> loja. Eu cuido de tudo. No fim eu te mostro quantas mensagens chegaram fora do
> horário e quantas viraram atendimento. Se não prestar, eu desligo e não se fala
> mais nisso."

O que muda com essa formulação:

| Pedido de compra | Pedido de teste |
|---|---|
| Precisa de verba | Custa zero para eles |
| Precisa de decisão | Precisa só de permissão |
| Risco é deles | Risco é seu |
| Compromisso indefinido | Acaba em 30 dias, com data |
| Ele avalia você | Ele avalia números |

Um dono de loja diz "não" para uma compra com muito mais facilidade do que para
um teste de 30 dias que não custa nada e que o funcionário vai tocar sozinho.

**Uma filial, não a rede.** Escolha a filial cujo gerente está mais incomodado com
o WhatsApp — e converse com ele antes de falar com o dono. Um gerente pedindo
junto vale mais que qualquer argumento seu. Rede inteira de uma vez é onboarding
complexo, equipe não treinada e uma chance grande de o teste falhar por operação,
não por produto.

### O que você já tem e nenhum concorrente tem

Você trabalha dentro de um comércio real, do setor, todo dia. Comece a **medir
hoje** — não precisa de bot, precisa de uma planilha e uma semana:

| O que medir | Como |
|---|---|
| Mensagens recebidas por dia | Contagem simples, uma semana |
| Quantas chegam depois do horário e no fim de semana | Marque o horário de cada uma |
| Quanto tempo até a primeira resposta | Diferença entre chegada e resposta |
| Quantas ficam sem resposta nenhuma | O número que dói |
| As 10 perguntas mais repetidas | Isso vira o FAQ e economiza IA |

Isso te dá duas coisas de valor imediato:

1. **O argumento do teste**, com número da própria loja: *"em uma semana chegaram
   84 mensagens, 31 fora do horário, e 12 ficaram sem resposta."* É bem mais forte
   que qualquer proposta.
2. **Conhecimento de setor que você pode usar na rua** — você passa a saber como
   funciona o WhatsApp de uma ótica de verdade, e isso aparece na conversa com
   qualquer comerciante.

> ⚠️ **Peça autorização por escrito antes de usar qualquer número da Samir fora
> dali** — em proposta, em post, em conversa de venda. Medir para melhorar o
> trabalho é uma coisa; usar dado da empresa para vender o seu produto é outra, e
> a diferença entre as duas é a autorização. Um e-mail ou mensagem do dono dizendo
> "pode usar" resolve.

### Se mesmo assim for não

Aceite rápido e siga. **Não insista, não reapresente, não tente de novo em duas
semanas.** Você trabalha lá — desgastar essa relação custa muito mais caro que o
case vale.

Nesse caso, seu primeiro case vem de fora, e o resto deste documento vale
integralmente. E daqui a seis meses, com três clientes pagando e resultado na mão,
a conversa com a Samir é outra — aí você é fornecedor, não funcionário.

---

## Antes de vender qualquer coisa: resolva o conflito

Você é funcionário de uma ótica e está prestes a vender software para o comércio
da região. Três pontos precisam estar resolvidos, e é melhor resolver agora do que
depois que houver dinheiro envolvido.

### 1. De quem é o código

Se você escreveu em horário de trabalho, com equipamento da empresa, ou como
tarefa atribuída, é bem possível que a empresa tenha direitos sobre ele — a CLT e
a Lei de Software tratam disso. Se escreveu fora do expediente, por conta própria,
sem relação com a sua função, o código tende a ser seu.

**Não resolva isso por dedução.** Duas ações concretas:
- Releia seu contrato de trabalho procurando cláusula de propriedade intelectual,
  invenções ou confidencialidade.
- Se houver qualquer ambiguidade, alinhe por escrito com o dono antes de faturar
  o primeiro cliente. Uma mensagem de "esse projeto é meu, fiz fora do trabalho"
  confirmada por ele vale muito.

Uma hora de advogado trabalhista resolve as duas. Custa pouco e evita o cenário
em que o negócio cresce e a empresa reivindica participação.

### 2. Não venda para as óticas da região

Isto é uma correção direta ao [documento 02](02-nichos-e-priorizacao.md), que
manda começar pelas óticas.

**Enquanto você trabalhar na Samir, óticas concorrentes estão fora.** Vender
atendimento automatizado para o concorrente do seu empregador, na mesma cidade,
é motivo de demissão por justa causa e pode configurar concorrência desleal — e
mesmo que não desse problema jurídico, acabaria com a sua relação lá no dia em
que descobrissem.

Comece por qualquer outro nicho: pet shop, oficina, barbearia, assistência técnica,
odontologia. Todos estão prontos no sistema. Óticas voltam para a mesa quando você
sair da Samir, ou com autorização expressa deles.

### 3. Tempo e atenção

Você tem salário — o que é uma vantagem enorme: a fase zero custa R$ 255/mês e
você não depende dela para pagar contas. Mas onboarding e suporte acontecem em
horário comercial, que é justamente quando você está trabalhando.

Seja realista com o número de pilotos: **três é o teto** enquanto você tiver
emprego. Prefira clientes perto de você e do tipo que aceita conversar no fim do
dia. E não prometa SLA de horário comercial que você não consegue cumprir.

---

## Fase 1 — Semanas 2 a 5: Programa Piloto Fundador

O objetivo desta fase **não é receita**. É conseguir três clientes no ar, felizes
e falando disso.

### A oferta

| Item | Piloto Fundador | Preço normal |
|---|---|---|
| Implantação | **R$ 297** | R$ 697 a R$ 2.500 |
| Mensalidade nos primeiros 60 dias | **R$ 0** | — |
| A partir do 61º dia | **40% de desconto, travado enquanto for cliente** | cheio |
| Vagas | **3** | — |

**Em troca, e por escrito:**
- Depoimento em vídeo de 40 segundos no dia 30 (você grava, ele só fala)
- Autorização para usar nome, marca e os números do painel
- 20 minutos de conversa por semana durante os 60 dias
- Uma indicação de outro comerciante

### Por que R$ 297 e não zero

**Nunca zere a implantação, nem no piloto.** Quem não paga nada não devolve a
ficha, não treina a equipe, não aparece na reunião de feedback e não sente falta
quando o serviço cai. A implantação simbólica não é sobre o dinheiro — é o que
separa interesse de curiosidade.

Além disso: **3 × R$ 297 = R$ 891, e a fase inteira custa R$ 255/mês.** A
implantação dos pilotos paga 3,5 meses de operação. A fase zero se autofinancia.

### Quem escolher — e isso decide tudo

Sem case, o critério de escolha do primeiro cliente **inverte** em relação ao doc 02.

| Escolha | Evite |
|---|---|
| Quem já te conhece e confia em você | Desconhecido que precisa de referência |
| Negócio simples: 1 unidade, poucos serviços | Rede com 8 filiais e catálogo enorme |
| Dono acessível, que decide sozinho e responde rápido | Empresa com sócios e comitê |
| Volume médio de WhatsApp, mas dono engajado | O maior volume da cidade |
| Nicho de configuração simples (pet shop, barbearia, oficina, assistência) | Setor regulado (clínica, advocacia) |
| Quem reclama espontaneamente do WhatsApp | Quem você precisa convencer de que tem um problema |

**Você vai errar no primeiro onboarding.** Erre barato, com alguém que te perdoa,
num negócio simples. Não estreie numa imobiliária de ticket alto.

> **Inversão importante:** o doc 02 manda começar pelo Tier A (imobiliária,
> clínica, planejados) porque o ticket é maior. Isso continua certo — **depois**
> que você tem prova. Ticket alto compra de quem tem referência. Comece onde a
> decisão é de uma pessoa só, rápida, e o risco percebido é baixo.

### Onde encontrar os três

Nesta fase, **rede quente antes de nicho**. Em ordem:

1. **Quem você já conhece** — cliente de outro serviço seu, amigo dono de comércio,
   parente, ex-colega. Faça a lista de 20 nomes hoje.
2. **Indicações de dentro da Samir** — fornecedores, representantes e clientes da loja que também são donos de comércio
3. **Seu bairro** — comércio onde você já é cliente e já conhece o dono pelo nome
4. **Teste do Fantasma** com 30 empresas, para os que não vieram das três acima

### O script desta fase

```
Oi [Nome]! [Seu nome].

Montei um sistema que atende o WhatsApp da empresa 24h — responde na hora,
qualifica o cliente e passa pro vendedor com o resumo pronto.

Vou ser direto: está pronto e funcionando, mas você seria o primeiro cliente.
Por isso a proposta é diferente. Estou pegando 3 empresas pra rodar 60 dias
sem mensalidade, e quem entrar agora trava 40% de desconto pra sempre.

O que eu quero em troca é seu feedback e, se der certo, seu depoimento.

Te mostro funcionando com o nome da sua loja em 20 minutos. Quando dá?
```

Curto, honesto sobre ser o primeiro, e a escassez é real (são 3 mesmo).

---

## Quando perguntarem "quem já usa isso?"

Vai acontecer em toda reunião. A única resposta sustentável é a verdadeira:

> "Ninguém ainda — você seria o primeiro, e é exatamente por isso que a proposta
> é essa. Daqui a três meses eu vou estar cobrando cheio e mostrando resultado de
> outros. Hoje eu preciso do seu caso mais do que da sua mensalidade: por isso são
> 60 dias sem pagar e desconto travado pra sempre.
>
> O que eu não vou fazer é inventar cliente que eu não tenho. Deixa eu te mostrar
> funcionando — em 20 minutos você decide sozinho, sem precisar acreditar em mim."

Três coisas acontecem aí: você é honesto (e ele percebe), a oferta fica explicada
(o desconto tem um motivo real), e a decisão sai da confiança e vai para a
demonstração — onde você é forte.

**Nunca invente cliente, nem "um cliente que prefere não ser citado".** A cidade é
pequena, o comerciante conhece todo mundo, e mentira descoberta encerra o negócio
antes de começar.

---

## Reversão de risco: o que substitui a prova

Sem case, quem assume o risco é você. Três níveis, do mais conservador ao mais agressivo:

| Nível | Oferta | Quando usar |
|---|---|---|
| 1 | **Garantia de 30 dias**: cancelou, devolve a mensalidade (a implantação não) | Padrão, para sempre |
| 2 | **Pague depois**: implantação agora, mensalidade só no 31º dia se continuar | Prospect interessado mas travado no risco |
| 3 | **Piloto Fundador**: 60 dias sem mensalidade + preço travado | Só os 3 primeiros |

A garantia de 30 dias (nível 1) deve ficar em **toda** proposta, para sempre — ela
custa quase nada (o custo variável de um mês é ~R$ 60) e derruba a maior objeção
que existe quando não há referência.

---

## Fase 2 — Semanas 6 a 9: transformar piloto em prova

Um case não aparece sozinho. Ele é construído de propósito, desde o dia 1.

| Quando | O que fazer |
|---|---|
| **Dia 1** | Anotar o "antes": quantas mensagens/dia, quem responde, quanto tempo demora, o que acontece à noite |
| **Semanal** | 20 min com o dono. Anotar frases dele — depoimento é feito de fala espontânea, não de roteiro |
| **Dia 30** | Puxar os números do painel e **gravar o vídeo no pico do entusiasmo** |
| **Dia 45** | Publicar o primeiro case |
| **Dia 60** | Converter para pago no preço fundador + pedir a indicação combinada |

### Se o primeiro case for a Samir, declare a relação

Se o teste de 30 dias na filial acontecer e virar seu primeiro case, **diga que
você trabalha lá.** Sempre, sem ser perguntado:

> "Esse é o resultado da ótica onde eu trabalho — foi onde eu consegui testar
> primeiro. Não é cliente pagante, é implantação real com números reais."

Duas razões. A primeira é que o prospect vai descontar um depoimento de empregador
de qualquer jeito, e omitir só faz você parecer desonesto quando ele descobrir —
em cidade pequena, ele descobre. A segunda é que declarar aumenta a credibilidade
do resto: quem é transparente sobre a fraqueza do próprio case ganha o benefício
da dúvida no que afirma.

Um case interno declarado vale bem mais que nenhum case. Só não vale tanto quanto
um cliente pagante — por isso ele não substitui os três pilotos da Fase 1.

### O case pequeno já serve

Você não precisa de números grandes. Precisa de números **reais e específicos**:

> "Em 30 dias: 412 mensagens atendidas, 147 delas fora do horário comercial.
> 23 clientes encaminhados para a loja com resumo pronto. Antes, essas 147
> mensagens esperavam até o dia seguinte."

Isso é um case completo. Vale mais que qualquer promessa, e você tem no dia 30.

### As três perguntas do vídeo

Não escreva roteiro. Grave o celular na mão, pergunte e deixe ele falar:

1. Como era o WhatsApp de vocês antes?
2. O que mudou depois que o sistema entrou?
3. Você indicaria para outro comerciante? Por quê?

Quarenta segundos de dono de loja falando torto valem mais que um vídeo produzido.

---

## Fase 3 — Semana 10 em diante: primeira venda cheia

Com um case em vídeo e números reais, você volta ao playbook original: doc 02
(nichos e prioridade), doc 04 (prospecção), doc 05 (scripts), doc 10 (90 dias).

**Aí sim** faz sentido atacar o Tier A — imobiliária, clínica, planejados — porque
agora existe referência para sustentar o ticket.

---

## Metas honestas da fase zero

Meta não é faturamento. Nos primeiros 60 dias, é isto:

| Marco | Prazo |
|---|---|
| Bot rodando no seu próprio WhatsApp | Dia 7 |
| Uma semana de medição do WhatsApp da loja, na planilha | Dia 7 |
| Pedido de teste de 30 dias em uma filial feito ao dono | Dia 10 |
| Lista de 20 nomes da rede quente | Dia 10 |
| 3 pilotos assinados | Dia 30 |
| 3 pilotos no ar e funcionando | Dia 40 |
| 1 depoimento em vídeo + números reais | Dia 60 |
| Primeira venda a preço cheio | Dia 75 |

**Receita nos primeiros 60 dias: R$ 891** (as três implantações). É pouco de
propósito — você está comprando prova, e prova é o insumo mais caro que falta.

### O que faz esta fase falhar

| Erro | Por que mata |
|---|---|
| Dar tudo de graça | Cliente sem custo não engaja, não vira depoimento, e ainda te ensina errado |
| Escolher o cliente grande demais | Onboarding complexo + você inexperiente = primeiro case ruim |
| Insistir com quem já disse não | Consome semanas e produz um cliente que cancela no mês 2 |
| Vender para ótica concorrente enquanto trabalha na Samir | Justa causa, e acaba com a relação que te sustenta hoje |
| Esperar o produto ficar "pronto" | Ele já está. O que falta é cliente, e cliente não aparece no código |
| Inventar referência | Cidade pequena. Descobriram, acabou |
| Sair vendendo antes de colocar no próprio WhatsApp | Você vende 24h com um número que não responde à noite |

---

## Resumo em uma página

1. **Semana 1** — bot no seu próprio WhatsApp. Lista de 20 nomes da rede quente.
2. **Semana 1** — meça o WhatsApp da própria loja por uma semana. Depois peça
   para **testar 30 dias em uma filial**, sem custo — não peça para comprar.
   E resolva antes: de quem é o código, e nada de vender para ótica concorrente.
3. **Semanas 2–5** — Piloto Fundador: 3 vagas, R$ 297 de implantação, 60 dias sem
   mensalidade, 40% travado depois. Rede quente primeiro, negócio simples,
   dono engajado.
4. **Em toda reunião** — `npm run demo`, monte o bot dele em 20 minutos e entregue
   o celular na mão dele. A demonstração é a prova.
5. **Quando perguntarem quem usa** — diga a verdade e explique por que a oferta é
   diferente hoje.
6. **Dia 30** — números do painel e vídeo do dono.
7. **Semana 10** — case na mão, volte ao playbook completo e comece a cobrar cheio.

**Custo para rodar tudo isso: R$ 255/mês.** As três implantações cobrem 3,5 meses.
O risco financeiro desta fase é menor que o de um jantar por semana.
