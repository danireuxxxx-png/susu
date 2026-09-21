# TShop — loja de celulares

Vitrine e catálogo para a TShop, construída como uma experiência
cinematográfica: fundo branco, muito espaço negativo, produto em escala e
movimento discreto guiado pelo scroll.

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Geist (auto-hospedada)

---

## ⚠️ Antes de publicar

Duas coisas neste repositório **não** são dados reais da loja.

### 1. Perfil da loja (`src/lib/store.ts`)

Os perfis do **Instagram (@tshopdf)** e do **Google Business** não puderam ser
lidos automaticamente: o ambiente onde este projeto foi construído bloqueia
`instagram.com` e `share.google` por política de rede. Nenhum endereço,
telefone, horário, catálogo ou foto foi extraído deles.

Por isso, campos como endereço, telefone, e-mail, horário e CNPJ estão
marcados com `verified: false` e contêm **placeholders óbvios**. Publicar um
endereço ou CNPJ inventado para um negócio real seria pior do que não
publicar nenhum.

Em modo de desenvolvimento, o rodapé exibe um aviso listando cada campo
pendente. Para publicar:

1. Abra `src/lib/store.ts`.
2. Substitua cada valor `unverified(...)` pelo dado real.
3. Troque `unverified` por `verified` naquele campo.
4. O aviso do rodapé desaparece sozinho quando a lista esvazia.

### 2. Catálogo (`src/lib/products.ts`)

Nomes e especificações dos aparelhos são fatos públicos dos fabricantes.
**Preços, estoque e parcelamento são exemplos** — não vieram da TShop.
Substitua o array `products` pelo catálogo real; o formato é estável e todas
as páginas leem dele.

### 3. Outros pontos em aberto

| Item | Situação |
|---|---|
| Fotografia de produto | Nenhuma disponível — ver "Imagens" abaixo |
| Checkout / pagamento | `/checkout` revisa o pedido e encaminha para a loja; **não cobra** |
| Newsletter | Valida no cliente e não envia para lugar nenhum — precisa de um endpoint |
| `NEXT_PUBLIC_SITE_URL` | Defina a origem de produção (canonical, OG, sitemap) |

Nenhuma chave, token ou segredo é lido no cliente. Ao integrar pagamento ou
newsletter, valide e recalcule **no servidor** — o total do carrinho vindo do
cliente nunca deve ser confiado.

---

## Imagens de produto

Não havia fotografia disponível, então os aparelhos são desenhados por
`src/components/product/device-render.tsx`: um render vetorial construído
com os mesmos ingredientes de um estúdio — luz principal no canto superior
esquerdo, banda especular nas laterais metálicas, reflexo difuso no vidro,
lentes com brilho pontual e sombra de contato. É nítido em 4K e pesa poucos
kilobytes.

**Para trocar por fotos reais**, não é preciso mexer em componente nenhum:

```ts
// src/lib/products.ts
photos: [
  "/produtos/iphone-17-pro-max/frente.avif",
  "/produtos/iphone-17-pro-max/traseira.avif",
],
```

`<ProductImage>` é o único ponto de contato entre foto e render: havendo
foto, ela é usada (via `next/image`, com AVIF/WebP e `sizes` já definidos);
não havendo, o render entra no lugar. Para imagens de CDN externa, registre o
host em `next.config.ts` → `images.remotePatterns`.

---

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run start
npm run lint
npm run typecheck
```

---

## Preview estático

Além do build normal (servidor), há um modo de exportação estática usado para
gerar um preview compartilhável:

```bash
STATIC_EXPORT=1 npm run build   # gera out/
node scripts/prepare-preview.mjs
```

O script faz três ajustes exigidos pelo host do preview, nenhum deles
necessário em um deploy de verdade:

1. move `out/_next` para `out/assets/_next`, casando com o `assetPrefix`
   definido em `next.config.ts` — o host reserva caminhos de primeiro nível
   começando com `_`;
2. remove as entradas reservadas na raiz (payloads de prefetch do segmento e
   a rota `_not-found`); o custo é só o prefetch de links, já que o Next cai
   para navegação normal, e `404.html` continua cobrindo rotas desconhecidas;
3. escapa `U+FFFD` literais no JavaScript emitido. O polyfill de decodificação
   de URL do Next os contém de propósito (é o que `decodeURIComponent`
   devolve para uma sequência malformada), mas um caractere de substituição
   cru é indistinguível de mojibake para um pipeline de publicação. Dentro de
   uma string JS, `"\uFFFD"` é exatamente o mesmo valor — a reescrita é
   sem perda.

O build padrão (`npm run build`) segue sendo um build de servidor Next.js, com
otimização de imagem — é ele que vai para produção.

---

## Arquitetura

```
src/
  app/                 rotas (App Router), sitemap, robots, ícone
  components/
    layout/            header, footer, cursor, transição de página
    product/           card, grid, galeria, detalhe, render do aparelho
    sections/          hero, showcase, features, ofertas, confiança
    search/  cart/     overlay de busca, drawer da sacola
    ui/                button, price, reveal, overlay, skeleton, ícones
  hooks/               carrinho, media queries, scroll lock
  lib/                 dados da loja, catálogo, tipos, formatação
```

### Design system

Tudo vive em `src/app/globals.css`, como tokens do `@theme` do Tailwind v4:
cores, tipografia fluida (`--text-display` e afins escalam por `clamp()`, sem
breakpoints), raios, sombras em camadas e as curvas de easing. Nenhum
componente define cor, sombra ou curva própria — mudar um token muda o site
inteiro.

A tipografia é **Geist**, instalada via npm e auto-hospedada: nada é baixado
de rede externa em build ou em runtime.

### Movimento

| Onde | O quê |
|---|---|
| Hero | Entrada escalonada; reflexo cruza o aparelho; parallax a 12% do scroll |
| Showcase | Aparelho fixado por 3 telas, girando 28° enquanto 3 capítulos passam |
| Seções | `<Reveal>` — um `IntersectionObserver` por elemento, que se desconecta |
| Cards | Elevação de 1,5px e escala de 1,045 no hover |
| Cursor | Ponto de 10px que incha sobre elementos interativos (só ponteiro fino) |

Só `transform` e `opacity` são animados — nada dispara layout. Listeners de
scroll são passivos e agrupados em `requestAnimationFrame`, e o do showcase
só fica ativo enquanto a seção está perto da viewport.

**`prefers-reduced-motion`** desliga tudo: um bloco global em `globals.css`
colapsa as animações para o estado final, o cursor não é renderizado, a
transição de página some e o showcase deixa de fixar (vira seções
empilhadas). Nada fica invisível por causa de uma animação que não rodou.

### Acessibilidade

Link "pular para o conteúdo" como primeiro tab stop; foco visível em tudo
(anel de 2px, nunca removido); overlays com `role="dialog"`, `aria-modal`,
Escape, focus trap e foco devolvido ao gatilho; scroll do fundo travado com
compensação de scrollbar; `aria-live` em resultados de busca, quantidade e
contagem de filtros; zoom nunca bloqueado (`maximumScale: 5`).

### SEO

Metadata por rota com `title.template`, canonical, Open Graph e Twitter;
`sitemap.xml` e `robots.txt` gerados; JSON-LD de `Store` no layout e de
`Product` + `BreadcrumbList` em cada PDP. `/checkout` e `/conta` ficam fora
do índice.

### Performance

Páginas estáticas ou SSG (as 11 PDPs são pré-renderizadas). Os aparelhos são
SVG inline — sem requisição, sem layout shift, nítidos em qualquer densidade.
Os skeletons têm a mesma geometria dos cards reais, então a troca não
desloca nada.

---

## Verificação

O layout foi conferido em 375, 390, 414, 768, 1024, 1280, 1440, 1920 e
2560px — sem overflow horizontal em nenhum deles — e o fluxo completo
(configurar aparelho → sacola → persistência → busca → filtros → teclado →
reduced motion) foi testado com Playwright.
