import type { MenuCategory, MenuItem } from "@/lib/types";

export const categorias: MenuCategory[] = [
  { id: "entradas", nome: "Entradas & Sunomono", descricaoCurta: "Para começar bem" },
  { id: "temakis", nome: "Temakis", descricaoCurta: "Enrolados na hora" },
  { id: "combinados", nome: "Sushi & Sashimi", descricaoCurta: "Combinados da casa" },
  { id: "donburis", nome: "Donburis", descricaoCurta: "Nossa assinatura" },
  { id: "yakisoba", nome: "Yakisoba & Wok", descricaoCurta: "Direto do wok" },
  { id: "sobremesas", nome: "Sobremesas", descricaoCurta: "Doce final" },
  { id: "bebidas", nome: "Bebidas", descricaoCurta: "Para acompanhar" },
];

export const itens: MenuItem[] = [
  // Entradas
  {
    id: "gyoza-shimeji",
    nome: "Gyoza de Shimeji",
    descricao: "Cinco unidades douradas na chapa, recheadas com shimeji e cebolinha, molho ponzu.",
    preco: 32,
    categoriaId: "entradas",
    illustration: "gyoza",
    tags: ["vegetariano"],
    serve: "2 pessoas",
  },
  {
    id: "ceviche-nikkei",
    nome: "Ceviche Nikkei",
    descricao: "Peixe branco curado no leche de tigre com toque de gengibre, cebola roxa e pimenta biquinho.",
    preco: 46,
    categoriaId: "entradas",
    illustration: "sashimi",
    tags: ["picante", "mais-pedido"],
    serve: "2 pessoas",
  },
  {
    id: "harumaki-legumes",
    nome: "Harumaki de Legumes",
    descricao: "Rolinho crocante recheado com legumes salteados, servido com molho agridoce.",
    preco: 28,
    categoriaId: "entradas",
    illustration: "gyoza",
    tags: ["vegetariano"],
  },
  {
    id: "sunomono",
    nome: "Sunomono",
    descricao: "Salada de pepino japonês em vinagrete doce com gergelim tostado.",
    preco: 24,
    categoriaId: "entradas",
    illustration: "sashimi",
    tags: ["vegetariano"],
  },

  // Temakis
  {
    id: "temaki-salmao",
    nome: "Temaki Salmão Grelhado",
    descricao: "Alga nori, arroz temperado, salmão grelhado maçaricado, cream cheese e cebolinha.",
    preco: 34,
    categoriaId: "temakis",
    illustration: "temaki",
    tags: ["mais-pedido"],
  },
  {
    id: "temaki-skin",
    nome: "Temaki Skin",
    descricao: "Pele de salmão crocante, arroz temperado, cream cheese e molho tarê.",
    preco: 29,
    categoriaId: "temakis",
    illustration: "temaki",
  },
  {
    id: "temaki-hot-philadelphia",
    nome: "Temaki Hot Philadelphia",
    descricao: "Salmão empanado, cream cheese, cebolinha e maionese picante.",
    preco: 36,
    categoriaId: "temakis",
    illustration: "temaki",
    tags: ["picante"],
  },
  {
    id: "temaki-vegetariano",
    nome: "Temaki Vegetariano",
    descricao: "Pepino, manga, cream cheese e gergelim tostado — fresco e leve.",
    preco: 27,
    categoriaId: "temakis",
    illustration: "temaki",
    tags: ["vegetariano"],
  },

  // Combinados / sushi
  {
    id: "combinado-nikkei-20",
    nome: "Combinado Nikkei 20 Peças",
    descricao: "Seleção da casa com niguiris, uramakis e sashimis variados.",
    preco: 89,
    categoriaId: "combinados",
    illustration: "nigiri",
    tags: ["mais-pedido"],
    serve: "2 pessoas",
  },
  {
    id: "sashimi-salmao-10",
    nome: "Sashimi de Salmão",
    descricao: "10 fatias generosas de salmão fresco, cortado na hora.",
    preco: 54,
    categoriaId: "combinados",
    illustration: "sashimi",
  },
  {
    id: "uramaki-especial",
    nome: "Uramaki Especial",
    descricao: "8 unidades com salmão maçaricado, cream cheese e crocante de alho.",
    preco: 42,
    categoriaId: "combinados",
    illustration: "nigiri",
  },
  {
    id: "niguiri-trio",
    nome: "Niguiri Trio",
    descricao: "Salmão, atum e peixe branco, seis unidades no total.",
    preco: 38,
    categoriaId: "combinados",
    illustration: "nigiri",
  },

  // Donburis
  {
    id: "donburi-salmao-macarico",
    nome: "Donburi de Salmão Maçaricado",
    descricao: "Arroz da casa, salmão maçaricado, molho tarê, gergelim e cebolinha.",
    preco: 62,
    categoriaId: "donburis",
    illustration: "donburi",
    tags: ["mais-pedido"],
  },
  {
    id: "donburi-nikkei-atum",
    nome: "Donburi Nikkei de Atum",
    descricao: "Atum selado ao molho nikkei, abacate, cebola roxa e pimenta biquinho.",
    preco: 68,
    categoriaId: "donburis",
    illustration: "donburi",
    tags: ["picante"],
  },
  {
    id: "gyu-donburi",
    nome: "Gyu Donburi",
    descricao: "Fatias de picanha grelhada, cebola caramelizada e molho shoyu especial.",
    preco: 72,
    categoriaId: "donburis",
    illustration: "donburi",
    tags: ["novo"],
  },
  {
    id: "donburi-vegetariano",
    nome: "Donburi Vegetariano de Cogumelos",
    descricao: "Shimeji e shitake salteados, ovo poché, cebolinha e gergelim.",
    preco: 48,
    categoriaId: "donburis",
    illustration: "donburi",
    tags: ["vegetariano"],
  },

  // Yakisoba
  {
    id: "yakisoba-frango",
    nome: "Yakisoba de Frango",
    descricao: "Macarrão oriental salteado no wok com frango e legumes crocantes.",
    preco: 44,
    categoriaId: "yakisoba",
    illustration: "yakisoba",
  },
  {
    id: "yakisoba-camarao",
    nome: "Yakisoba de Camarão",
    descricao: "Camarões grandes salteados com legumes e molho shoyu encorpado.",
    preco: 58,
    categoriaId: "yakisoba",
    illustration: "yakisoba",
    tags: ["mais-pedido"],
  },
  {
    id: "yakisoba-vegetariano",
    nome: "Yakisoba Vegetariano",
    descricao: "Legumes frescos da estação salteados no wok, molho shoyu leve.",
    preco: 40,
    categoriaId: "yakisoba",
    illustration: "yakisoba",
    tags: ["vegetariano"],
  },

  // Sobremesas
  {
    id: "cheesecake-yuzu",
    nome: "Cheesecake de Yuzu",
    descricao: "Base crocante, creme leve com toque cítrico de yuzu.",
    preco: 26,
    categoriaId: "sobremesas",
    illustration: "dessert",
    tags: ["novo"],
  },
  {
    id: "mochi-trio",
    nome: "Mochi Trio",
    descricao: "Três sabores da casa: gergelim preto, morango e chá verde.",
    preco: 22,
    categoriaId: "sobremesas",
    illustration: "dessert",
    tags: ["vegetariano"],
  },
  {
    id: "harumaki-doce-banana",
    nome: "Harumaki Doce de Banana",
    descricao: "Rolinho crocante de banana com canela, calda e sorvete de creme.",
    preco: 20,
    categoriaId: "sobremesas",
    illustration: "dessert",
    tags: ["vegetariano"],
  },

  // Bebidas
  {
    id: "sake-junmai",
    nome: "Saquê Junmai (dose)",
    descricao: "Saquê premium servido gelado, dose de 100ml.",
    preco: 28,
    categoriaId: "bebidas",
    illustration: "drink",
  },
  {
    id: "cha-verde-gelado",
    nome: "Chá Verde Gelado",
    descricao: "Chá verde japonês servido bem gelado com limão siciliano.",
    preco: 14,
    categoriaId: "bebidas",
    illustration: "drink",
    tags: ["vegetariano"],
  },
  {
    id: "refrigerante-lata",
    nome: "Refrigerante Lata",
    descricao: "Diversos sabores disponíveis, 350ml.",
    preco: 8,
    categoriaId: "bebidas",
    illustration: "drink",
  },
  {
    id: "agua-com-gas",
    nome: "Água com Gás",
    descricao: "Garrafa 500ml.",
    preco: 7,
    categoriaId: "bebidas",
    illustration: "drink",
  },
];

export function itensPorCategoria(categoriaId: string): MenuItem[] {
  return itens.filter((item) => item.categoriaId === categoriaId);
}

export function itemPorId(id: string): MenuItem | undefined {
  return itens.find((item) => item.id === id);
}

export const destaques = itens.filter((item) => item.tags?.includes("mais-pedido"));
