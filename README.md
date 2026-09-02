# One Grid — Landing page

Site estático (HTML + CSS + JS puro, sem build) para captação de leads do
**One Grid Formula**. Bilíngue, com **inglês como idioma padrão** e troca para
português no cabeçalho.

---

## Como rodar

Abra `index.html` direto no navegador, ou suba um servidor local:

```bash
python -m http.server 5173
```

Depois acesse `http://127.0.0.1:5173`.

Para publicar: suba a pasta inteira em qualquer hospedagem estática
(Vercel, Netlify, Cloudflare Pages, S3, ou a hospedagem atual do domínio).
Não há back-end obrigatório.

---

## Antes de publicar — 3 ajustes

Tudo fica em `assets/js/app.js`, no topo do arquivo:

```js
const SITE_CONFIG = {
  whatsapp: "5541999999999",                 // 1) número comercial, só dígitos, com DDI
  email:    "contato@onegridoficial.com.br", // 2) e-mail que recebe as solicitações
  endpoint: "",                              // 3) para onde o lead é enviado
  endpointHeaders: {}
};
```

**O `endpoint`** aceita qualquer URL que receba `POST` com JSON: RD Station,
HubSpot, Zapier, Make, Formspree ou uma API própria. Enquanto ficar vazio
(`""`), o site continua funcionando: o lead é guardado no navegador e o
formulário leva a pessoa ao WhatsApp já com o resumo preenchido.

O payload enviado inclui todos os campos do formulário mais `idioma`,
`pagina`, `enviado_em` e as UTMs da URL (`utm_source`, `utm_medium`,
`utm_campaign`, `gclid`, `fbclid`).

---

## Estrutura

```
site-one-grid/
├── index.html               páginas e seções
├── assets/
│   ├── css/style.css        design system completo
│   ├── js/i18n.js           TODOS os textos, EN e PT
│   ├── js/app.js            configuração, idioma, formulário, interações
│   ├── img/                 imagens tratadas do site
│   ├── fonts/               Satoshi + Inria Serif (fontes da marca, .woff2)
│   └── logo/                logo One Grid e favicons
├── robots.txt / sitemap.xml / vercel.json   arquivos do site publicado
├── _fontes/                 imagens de origem usadas por prepare-images.py
├── prepare-images.py        regenera assets/img a partir dos criativos
├── build-single-file.py     gera versão de arquivo único em dist/
└── dist/                    saídas de arquivo único
```

A raiz do repositório **é** o site. O `.vercelignore` mantém fora do ar os
scripts, o `_fontes/`, o `dist/` e o README — eles ficam versionados, mas não
são publicados.

---

## Editar textos

**Todos** os textos ficam em `assets/js/i18n.js`, com a mesma chave nos dois
idiomas. Para mudar uma frase, altere no bloco `en` **e** no bloco `pt`.

O site **sempre abre em inglês**. Quem quiser lê em português clicando em
**PT** no cabeçalho; a troca vale só durante a visita — ao recarregar, volta
para o inglês. Para uma campanha em português, use `?lang=pt` na URL: assim a
página já abre traduzida.

---

## Seções

| # | Seção | Conteúdo |
|---|-------|----------|
| — | Hero | sequência de vídeo controlada pelo scroll, selo *World's Best Racing Simulator* |
| 01 | The simulator | os três pilares: escala 1:1, movimento, acabamento |
| — | Faixa-manifesto | "The g-force is simulated. The adrenaline is real." |
| 02 | The experience | movimento, comando e imersão, com foto grande em cada bloco |
| — | Faixa de afirmação | "We build the machines. / We hand you the keys." |
| 03 | Atelier | foto da oficina em zoom lento ao lado dos 8 componentes |
| — | Raio-X | a carenagem fica transparente onde o cursor passa |
| 04 | Engineering | corte do simulador ao centro, itens 01–03 à esquerda e 04–06 à direita, com 6 pontos interativos |
| 05 | Specifications | ficha técnica do One Grid Formula |
| 06 | Comparison | setup convencional × One Grid, foto ao lado da tabela |
| 07 | Ambientes | residência, garagem/coleção, espaços premium |
| 08 | Process | conversa → projeto → produção → entrega |
| 09 | Formulário | qualificação em 3 etapas |
| 10 | FAQ | seis perguntas |

---

## Formulário de qualificação

Três etapas, com validação e barra de progresso:

1. **Sobre você** — nome, e-mail, telefone/WhatsApp, cidade, país
2. **Seu perfil** — profissão, tipo de comprador, local de instalação, se já tem simulador
3. **Seu projeto** — faixa de investimento, prazo, origem, mensagem, consentimento

As faixas de investimento são o principal filtro de qualificação:
até R$ 299 mil · R$ 300–500 mil · R$ 500 mil–1 milhão · acima de R$ 1 milhão ·
"quero entender melhor".

---

## Imagens

`prepare-images.py` gera `assets/img/` a partir dos criativos em
`marcas/one-grid/referencias` — ele recorta só a faixa fotográfica de cada
criativo, deixando de fora o texto — e das imagens limpas em `_fontes/`.

Para trocar uma imagem, edite a lista `JOBS` no script e rode:

```bash
python prepare-images.py
```

### Sequência de vídeo no banner

O banner tem 340svh de altura e o miolo fica preso na tela (`position: sticky`).
A posição do scroll define o quadro do vídeo — ele não toca sozinho. São três
clipes em `assets/video/` (6s, 6s e 8s), trocados na ordem, com cinco frases
entrando por cima e o título saindo de cena logo no começo.

O vídeo soma 9 MB, então **fica de fora** em três casos, e aí vale a foto de
sempre: tela menor que 900px, `prefers-reduced-motion` ligado, ou o navegador
em modo de economia de dados. O ritmo está no bloco 6 do `app.js`.

### Zoom lento na foto do Ateliê

A foto da oficina usa a animação `heroZoom` do CSS: se aproxima devagar, de 1
para 1,16 em 26 segundos, e só começa quando a seção entra na tela.

### Raio-X

Duas fotos do mesmo enquadramento sobrepostas — `raiox-casco.jpg` por cima e
`raiox-interno.jpg` por baixo. A de cima é recortada por uma máscara radial que
segue o cursor, então o interior aparece só onde o mouse está. No celular, o
mesmo efeito responde ao toque. Bloco 7 do `app.js`.

### Montagem por scroll (fora do site hoje)

`build-atelie-layers.py` fatia a foto do simulador em cinco camadas para uma
animação em que a máquina se monta conforme a pessoa rola a página. Essa
versão saiu do ar a pedido do cliente, mas o script continua aqui caso queira
retomá-la:

```bash
python build-atelie-layers.py --preview
```

### Geração por IA

`gen-partes.py` gera peças isoladas pela API do Gemini, usando as fotos reais
como referência. **Ele não chegou a rodar**: a conta está sem créditos
(`RESOURCE_EXHAUSTED`). Com crédito na conta, basta:

```bash
python gen-partes.py
```

---

## Versão de arquivo único

`build-single-file.py` embute CSS, JS, fontes e imagens em um único HTML:

```bash
python build-single-file.py
```

Gera `dist/one-grid-single.html` (~5 MB), que abre offline com dois cliques —
útil para enviar por e-mail ou apresentar sem internet.

---

## Publicar em onegridoficial.com.br

O domínio hoje aponta para o **Framer** (registros A `31.43.161.6` / `31.43.160.6`
e `www` como CNAME para `sites.framer.app`). O DNS é administrado dentro do
**registro.br** — os nameservers são `b.sec.dns.br` e `c.sec.dns.br`.

O Framer não aceita subir HTML próprio, então o caminho é hospedar esta pasta
em outro lugar e apontar o domínio para lá. **Ao trocar o DNS, o site atual do
Framer sai do ar** — vale salvar antes qualquer conteúdo ou formulário que
ainda esteja em uso lá.

### 1. Preencher os dados de contato (antes de tudo)

Em `assets/js/app.js`, no topo. Sem isso os botões de WhatsApp e e-mail apontam
para um número fictício:

```js
const SITE_CONFIG = {
  whatsapp: "55XXXXXXXXXXX",   // número comercial real, só dígitos, com DDI
  email:    "...",             // e-mail que recebe as solicitações
  endpoint: "",                // URL do CRM que recebe o lead
};
```

Depois rode `python prepare-images.py` só se tiver mexido em imagem.

### 2. Subir no Vercel

1. Entre em [vercel.com](https://vercel.com) e crie a conta (o plano free
   atende de sobra um site estático).
2. **Add New → Project → Import Git Repository** e escolha o repositório.
   Deixe **Root Directory vazio** — a raiz do repositório já é o site.
3. O Vercel gera uma URL provisória (`algo.vercel.app`). Abra e confira o site
   inteiro antes de mexer no domínio.

Depois disso, publicar é dar `git push` na branch `main`.

### 3. Ligar o domínio

No Vercel, em **Settings → Domains**, adicione `onegridoficial.com.br` e
`www.onegridoficial.com.br`. Ele mostra os registros a criar.

No **registro.br**, em *Editar Zona DNS* do domínio:

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` (raiz) | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Apague os registros antigos que apontam para o Framer. A propagação leva de
alguns minutos a algumas horas; o certificado HTTPS o Vercel emite sozinho
depois que o DNS responder.

> Confirme os valores na tela do próprio Vercel antes de salvar — ele às vezes
> indica um IP ou CNAME diferente conforme a região.

### 4. Depois de no ar

- **Analytics**: cole o script do GA4 ou do pixel do Meta antes de `</body>` no
  `index.html`.
- **Formulário**: preencha o `endpoint` com a URL do CRM. O site envia um
  `POST` em JSON com todos os campos mais `idioma`, `pagina`, `enviado_em` e as
  UTMs. Enquanto estiver vazio, o lead é guardado só no navegador de quem
  preencheu — ou seja, **você não recebe nada**.
- **Search Console**: cadastre o domínio e envie o `sitemap.xml`.

---

## Pontos a confirmar com o cliente

Estes textos são estimativas de marketing e devem ser validados antes de ir ao ar:

- **Espaço necessário** (FAQ): "área comparável à de uma vaga de garagem".
- **Títulos de simulação suportados**: hoje o texto diz "os principais títulos
  do mercado", sem citar nomes.
- **Prazo de retorno**: "até 1 dia útil".
- **Preço**: a linha "Investimento — a partir de R$ 299 mil" saiu da ficha
  técnica. O valor ainda aparece em dois lugares: no topo, abaixo dos botões
  do hero, e na primeira resposta do FAQ. Diga se quer tirar de lá também.
- **Selo "World's Best Racing Simulator"**: confirme se há premiação por trás
  ou se é claim de campanha — ele aparece em destaque no topo do site.

O site nunca menciona franquia, e nenhuma marca de categoria automobilística é
citada — o produto é descrito como *monoposto / carro de fórmula*.
