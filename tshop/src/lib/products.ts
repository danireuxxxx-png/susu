import type { Product } from "./types";

/**
 * CATALOG — DEMONSTRATION DATA
 *
 * Model names and specifications are real, publicly-known product facts.
 * PRICES, STOCK LEVELS AND INSTALMENT TERMS ARE PLACEHOLDERS and do not
 * come from TShop: the store's Instagram and Google Business profiles were
 * unreachable from this environment (egress policy), so no real catalogue,
 * pricing or photography could be extracted.
 *
 * Replace this array with the store's real catalogue — the shape is stable
 * and every page reads from it, so nothing else needs to change.
 */
export const products: Product[] = [
  {
    slug: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    brand: "Apple",
    category: "smartphones",
    tagline: "Titânio. Potência. Nada supérfluo.",
    description:
      "O ponto mais alto da linha. Estrutura em titânio de grau aeroespacial, " +
      "sistema de câmera profissional com teleobjetiva de alcance estendido e " +
      "a maior autonomia já entregue em um iPhone.",
    price: 10499,
    compareAtPrice: 11999,
    installments: 12,
    colors: [
      {
        name: "Titânio Natural",
        swatch: ["#c8c2b8", "#8e8880"],
        render: { body: ["#d6d0c6", "#9a948b"], frame: ["#e6e1d8", "#8b857c"], light: true },
      },
      {
        name: "Titânio Deserto",
        swatch: ["#c2a888", "#8a7255"],
        render: { body: ["#cdb391", "#8d755a"], frame: ["#e0c9a8", "#8a7255"], light: true },
      },
      {
        name: "Titânio Preto",
        swatch: ["#3a3a3c", "#161617"],
        render: { body: ["#3c3c3e", "#141416"], frame: ["#56565a", "#1c1c1e"], light: false },
      },
    ],
    storage: [
      { label: "256 GB", priceDelta: 0 },
      { label: "512 GB", priceDelta: 1800 },
      { label: "1 TB", priceDelta: 3600 },
    ],
    highlights: [
      { label: "Chip", value: "A19 Pro", detail: "6 núcleos de GPU com ray tracing em hardware" },
      { label: "Câmera", value: "48 MP", detail: "Sistema triplo com teleobjetiva de 5×" },
      { label: "Tela", value: "6,9\"", detail: "Super Retina XDR, 1 a 120 Hz" },
      { label: "Bateria", value: "33 h", detail: "Reprodução de vídeo" },
    ],
    specs: [
      {
        group: "Tela",
        items: [
          { label: "Tamanho", value: "6,9 polegadas" },
          { label: "Tecnologia", value: "Super Retina XDR OLED" },
          { label: "Taxa de atualização", value: "ProMotion 1–120 Hz" },
          { label: "Brilho máximo", value: "2.000 nits (exterior)" },
        ],
      },
      {
        group: "Desempenho",
        items: [
          { label: "Chip", value: "A19 Pro" },
          { label: "CPU", value: "6 núcleos" },
          { label: "GPU", value: "6 núcleos com ray tracing" },
        ],
      },
      {
        group: "Câmera",
        items: [
          { label: "Principal", value: "48 MP, ƒ/1.78" },
          { label: "Ultra-angular", value: "48 MP, ƒ/2.2" },
          { label: "Teleobjetiva", value: "12 MP, zoom óptico 5×" },
          { label: "Vídeo", value: "4K Dolby Vision a 120 qps" },
        ],
      },
      {
        group: "Construção",
        items: [
          { label: "Material", value: "Titânio grau 5" },
          { label: "Resistência", value: "IP68" },
          { label: "Peso", value: "221 g" },
        ],
      },
    ],
    render: {
      body: ["#d6d0c6", "#9a948b"],
      frame: ["#e6e1d8", "#8b857c"],
      screen: ["#1a1a20", "#05050a"],
      cameraLayout: "square",
      cameraCount: 3,
      cutout: "island",
      light: true,
    },
    photos: [],
    stock: 8,
    featured: 100,
  },
  {
    slug: "iphone-17-pro",
    name: "iPhone 17 Pro",
    brand: "Apple",
    category: "smartphones",
    tagline: "Toda a linha Pro, em outra escala.",
    description:
      "Mesmo chip, mesmo sistema de câmera e mesma construção em titânio do " +
      "Pro Max, em um corpo que desaparece na mão.",
    price: 8999,
    compareAtPrice: 9999,
    installments: 12,
    colors: [
      {
        name: "Titânio Natural",
        swatch: ["#c8c2b8", "#8e8880"],
        render: { body: ["#d6d0c6", "#9a948b"], frame: ["#e6e1d8", "#8b857c"], light: true },
      },
      {
        name: "Titânio Preto",
        swatch: ["#3a3a3c", "#161617"],
        render: { body: ["#3c3c3e", "#141416"], frame: ["#56565a", "#1c1c1e"], light: false },
      },
      {
        name: "Titânio Azul",
        swatch: ["#7d90a8", "#3f4e63"],
        render: { body: ["#8294ab", "#404f64"], frame: ["#9fb0c4", "#465570"], light: false },
      },
    ],
    storage: [
      { label: "256 GB", priceDelta: 0 },
      { label: "512 GB", priceDelta: 1800 },
    ],
    highlights: [
      { label: "Chip", value: "A19 Pro", detail: "Desempenho de classe desktop" },
      { label: "Câmera", value: "48 MP", detail: "Sistema Pro de três lentes" },
      { label: "Tela", value: "6,3\"", detail: "Super Retina XDR, 1 a 120 Hz" },
      { label: "Bateria", value: "27 h", detail: "Reprodução de vídeo" },
    ],
    specs: [
      {
        group: "Tela",
        items: [
          { label: "Tamanho", value: "6,3 polegadas" },
          { label: "Tecnologia", value: "Super Retina XDR OLED" },
          { label: "Taxa de atualização", value: "ProMotion 1–120 Hz" },
        ],
      },
      {
        group: "Desempenho",
        items: [
          { label: "Chip", value: "A19 Pro" },
          { label: "GPU", value: "6 núcleos com ray tracing" },
        ],
      },
      {
        group: "Câmera",
        items: [
          { label: "Principal", value: "48 MP, ƒ/1.78" },
          { label: "Teleobjetiva", value: "12 MP, zoom óptico 5×" },
        ],
      },
    ],
    render: {
      body: ["#d6d0c6", "#9a948b"],
      frame: ["#e6e1d8", "#8b857c"],
      screen: ["#16161c", "#04040a"],
      cameraLayout: "square",
      cameraCount: 3,
      cutout: "island",
      light: true,
    },
    photos: [],
    stock: 12,
    featured: 92,
  },
  {
    slug: "iphone-17",
    name: "iPhone 17",
    brand: "Apple",
    category: "smartphones",
    tagline: "O essencial, levado ao extremo.",
    description:
      "Tela ProMotion pela primeira vez na linha padrão, câmera dupla de " +
      "48 MP e autonomia para o dia inteiro. Em cinco cores.",
    price: 6499,
    installments: 12,
    colors: [
      { name: "Névoa", swatch: ["#e8e6e1", "#bfbcb5"], render: { body: ["#eceae5", "#c6c3bb"], light: true } },
      { name: "Sálvia", swatch: ["#b9c4b2", "#8a9784"], render: { body: ["#c2ccbb", "#8d9a87"], light: true } },
      { name: "Meia-noite", swatch: ["#2c313a", "#14171c"], render: { body: ["#2e333c", "#12151a"], light: false } },
    ],
    storage: [
      { label: "128 GB", priceDelta: 0 },
      { label: "256 GB", priceDelta: 900 },
      { label: "512 GB", priceDelta: 2400 },
    ],
    highlights: [
      { label: "Chip", value: "A19", detail: "Eficiência e desempenho equilibrados" },
      { label: "Câmera", value: "48 MP", detail: "Sistema duplo Fusion" },
      { label: "Tela", value: "6,3\"", detail: "ProMotion até 120 Hz" },
      { label: "Bateria", value: "22 h", detail: "Reprodução de vídeo" },
    ],
    specs: [
      {
        group: "Tela",
        items: [
          { label: "Tamanho", value: "6,3 polegadas" },
          { label: "Tecnologia", value: "Super Retina XDR OLED" },
        ],
      },
      {
        group: "Desempenho",
        items: [{ label: "Chip", value: "A19" }],
      },
      {
        group: "Câmera",
        items: [
          { label: "Principal", value: "48 MP, ƒ/1.6" },
          { label: "Ultra-angular", value: "12 MP" },
        ],
      },
    ],
    render: {
      body: ["#eceae5", "#c6c3bb"],
      frame: ["#f2f0ec", "#bdbab3"],
      screen: ["#151a24", "#05070d"],
      cameraLayout: "pill",
      cameraCount: 2,
      cutout: "island",
      light: true,
    },
    photos: [],
    stock: 20,
    featured: 84,
  },
  {
    slug: "galaxy-s26-ultra",
    name: "Galaxy S26 Ultra",
    brand: "Samsung",
    category: "smartphones",
    tagline: "Duzentos megapixels. Zero desculpas.",
    description:
      "Sensor principal de 200 MP, zoom óptico de 10× e S Pen integrada. " +
      "A ferramenta de trabalho mais completa da categoria.",
    price: 9799,
    compareAtPrice: 10999,
    installments: 12,
    colors: [
      { name: "Titânio Cinza", swatch: ["#8d8d8f", "#4b4b4e"], render: { body: ["#909093", "#48484c"], light: false } },
      { name: "Titânio Violeta", swatch: ["#9b93b8", "#5b5275"], render: { body: ["#9d95ba", "#575073"], light: false } },
      { name: "Titânio Preto", swatch: ["#3d3d40", "#151517"], render: { body: ["#3f3f42", "#141416"], light: false } },
    ],
    storage: [
      { label: "256 GB", priceDelta: 0 },
      { label: "512 GB", priceDelta: 1500 },
      { label: "1 TB", priceDelta: 3200 },
    ],
    highlights: [
      { label: "Câmera", value: "200 MP", detail: "Sensor principal com OIS" },
      { label: "Zoom", value: "10×", detail: "Teleobjetiva óptica periscópica" },
      { label: "Tela", value: "6,9\"", detail: "Dynamic AMOLED 2X, 120 Hz" },
      { label: "S Pen", value: "Integrada", detail: "Latência de 2,8 ms" },
    ],
    specs: [
      {
        group: "Tela",
        items: [
          { label: "Tamanho", value: "6,9 polegadas" },
          { label: "Tecnologia", value: "Dynamic AMOLED 2X" },
          { label: "Resolução", value: "QHD+ (3120 × 1440)" },
        ],
      },
      {
        group: "Desempenho",
        items: [
          { label: "Processador", value: "Snapdragon 8 Elite" },
          { label: "Memória", value: "12 GB LPDDR5X" },
        ],
      },
      {
        group: "Câmera",
        items: [
          { label: "Principal", value: "200 MP, ƒ/1.7" },
          { label: "Periscópica", value: "50 MP, zoom 10×" },
          { label: "Ultra-angular", value: "50 MP" },
        ],
      },
    ],
    render: {
      body: ["#909093", "#48484c"],
      frame: ["#a8a8ac", "#3c3c40"],
      screen: ["#0d1426", "#02040c"],
      cameraLayout: "vertical",
      cameraCount: 4,
      cutout: "punch",
      light: false,
    },
    photos: [],
    stock: 6,
    featured: 96,
  },
  {
    slug: "galaxy-s26-plus",
    name: "Galaxy S26+",
    brand: "Samsung",
    category: "smartphones",
    tagline: "Tela grande. Corpo leve.",
    description:
      "6,7 polegadas de Dynamic AMOLED com brilho de pico de 2.600 nits, " +
      "em um chassi de 196 gramas.",
    price: 7299,
    installments: 12,
    colors: [
      { name: "Cinza Gelo", swatch: ["#c9cdd2", "#8e949c"], render: { body: ["#ccd0d5", "#8b9199"], light: true } },
      { name: "Verde Menta", swatch: ["#b4cdc0", "#7e9c8c"], render: { body: ["#b8d0c3", "#7c9a8a"], light: true } },
      { name: "Preto Ônix", swatch: ["#38383b", "#131315"], render: { body: ["#3a3a3d", "#121214"], light: false } },
    ],
    storage: [
      { label: "256 GB", priceDelta: 0 },
      { label: "512 GB", priceDelta: 1200 },
    ],
    highlights: [
      { label: "Tela", value: "6,7\"", detail: "Dynamic AMOLED 2X, 120 Hz" },
      { label: "Câmera", value: "50 MP", detail: "Sistema triplo" },
      { label: "Bateria", value: "4.900 mAh", detail: "Carga rápida de 45 W" },
      { label: "Peso", value: "196 g", detail: "Estrutura em alumínio" },
    ],
    specs: [
      {
        group: "Tela",
        items: [
          { label: "Tamanho", value: "6,7 polegadas" },
          { label: "Tecnologia", value: "Dynamic AMOLED 2X" },
        ],
      },
      {
        group: "Desempenho",
        items: [{ label: "Processador", value: "Snapdragon 8 Elite" }],
      },
      {
        group: "Câmera",
        items: [
          { label: "Principal", value: "50 MP, ƒ/1.8" },
          { label: "Teleobjetiva", value: "10 MP, zoom 3×" },
        ],
      },
    ],
    render: {
      body: ["#ccd0d5", "#8b9199"],
      frame: ["#dde0e4", "#878d95"],
      screen: ["#101a2e", "#03060f"],
      cameraLayout: "vertical",
      cameraCount: 3,
      cutout: "punch",
      light: true,
    },
    photos: [],
    stock: 14,
    featured: 70,
  },
  {
    slug: "galaxy-z-fold-7",
    name: "Galaxy Z Fold 7",
    brand: "Samsung",
    category: "smartphones",
    tagline: "Um celular. Depois, um tablet.",
    description:
      "Dobra ao meio e abre em 8 polegadas. A dobradiça mais fina já " +
      "produzida pela Samsung, sem vinco visível.",
    price: 13499,
    compareAtPrice: 14999,
    installments: 12,
    colors: [
      { name: "Azul Sombra", swatch: ["#5a6a80", "#2c3644"], render: { body: ["#5d6d83", "#2a3442"], light: false } },
      { name: "Prata Cromado", swatch: ["#d5d7da", "#9a9da2"], render: { body: ["#d8dadd", "#979aa0"], light: true } },
    ],
    storage: [
      { label: "256 GB", priceDelta: 0 },
      { label: "512 GB", priceDelta: 1600 },
      { label: "1 TB", priceDelta: 3400 },
    ],
    highlights: [
      { label: "Tela interna", value: "8,0\"", detail: "Dynamic AMOLED 2X dobrável" },
      { label: "Tela externa", value: "6,5\"", detail: "Proporção convencional" },
      { label: "Espessura", value: "4,2 mm", detail: "Aberto" },
      { label: "Multitarefa", value: "3 apps", detail: "Simultâneos em tela cheia" },
    ],
    specs: [
      {
        group: "Telas",
        items: [
          { label: "Principal", value: "8,0\" QXGA+ dobrável" },
          { label: "Externa", value: "6,5\" FHD+" },
        ],
      },
      {
        group: "Construção",
        items: [
          { label: "Dobradiça", value: "Armor FlexHinge" },
          { label: "Resistência", value: "IP48" },
        ],
      },
    ],
    render: {
      body: ["#5d6d83", "#2a3442"],
      frame: ["#7a8a9e", "#2f3a49"],
      screen: ["#0b1220", "#02040a"],
      cameraLayout: "vertical",
      cameraCount: 3,
      cutout: "punch",
      light: false,
    },
    photos: [],
    stock: 3,
    featured: 88,
  },
  {
    slug: "xiaomi-16-pro",
    name: "Xiaomi 16 Pro",
    brand: "Xiaomi",
    category: "smartphones",
    tagline: "Óptica Leica. Preço que surpreende.",
    description:
      "Sistema de câmeras co-desenvolvido com a Leica, carregamento de " +
      "120 W e tela de 6,73 polegadas com brilho de 3.000 nits.",
    price: 5299,
    compareAtPrice: 6199,
    installments: 12,
    colors: [
      { name: "Preto Leica", swatch: ["#2f2f31", "#111112"], render: { body: ["#313133", "#101011"], light: false } },
      { name: "Branco Cerâmica", swatch: ["#f0efec", "#cbc9c4"], render: { body: ["#f2f1ee", "#c9c7c2"], light: true } },
    ],
    storage: [
      { label: "256 GB", priceDelta: 0 },
      { label: "512 GB", priceDelta: 700 },
    ],
    highlights: [
      { label: "Câmera", value: "Leica", detail: "Sistema triplo Summilux" },
      { label: "Carga", value: "120 W", detail: "100% em 19 minutos" },
      { label: "Tela", value: "6,73\"", detail: "AMOLED LTPO, 3.000 nits" },
      { label: "Chip", value: "8 Elite", detail: "Snapdragon de última geração" },
    ],
    specs: [
      {
        group: "Tela",
        items: [
          { label: "Tamanho", value: "6,73 polegadas" },
          { label: "Resolução", value: "WQHD+" },
        ],
      },
      {
        group: "Câmera",
        items: [
          { label: "Principal", value: "50 MP Leica Summilux" },
          { label: "Periscópica", value: "50 MP, zoom 5×" },
        ],
      },
      {
        group: "Bateria",
        items: [
          { label: "Capacidade", value: "5.400 mAh" },
          { label: "Carga com fio", value: "120 W" },
          { label: "Carga sem fio", value: "50 W" },
        ],
      },
    ],
    render: {
      body: ["#313133", "#101011"],
      frame: ["#55555a", "#1a1a1c"],
      screen: ["#1b1208", "#060302"],
      cameraLayout: "circle",
      cameraCount: 3,
      cutout: "punch",
      light: false,
    },
    photos: [],
    stock: 17,
    featured: 76,
  },
  {
    slug: "motorola-edge-70-ultra",
    name: "Motorola Edge 70 Ultra",
    brand: "Motorola",
    category: "smartphones",
    tagline: "Curvas que somem na mão.",
    description:
      "Tela curva nas quatro bordas, acabamento em couro vegano e a " +
      "assinatura de cor Pantone calibrada de fábrica.",
    price: 4299,
    installments: 12,
    colors: [
      { name: "Verde Floresta", swatch: ["#5c7361", "#334036"], render: { body: ["#5f7664", "#313e34"], light: false } },
      { name: "Areia", swatch: ["#d6c5ae", "#a4937c"], render: { body: ["#d9c9b3", "#a4937c"], light: true } },
    ],
    storage: [
      { label: "256 GB", priceDelta: 0 },
      { label: "512 GB", priceDelta: 600 },
    ],
    highlights: [
      { label: "Tela", value: "6,7\"", detail: "pOLED curva, 144 Hz" },
      { label: "Cor", value: "Pantone", detail: "Validada para pele e cores" },
      { label: "Carga", value: "125 W", detail: "TurboPower" },
      { label: "Acabamento", value: "Couro", detail: "Vegano, toque acetinado" },
    ],
    specs: [
      {
        group: "Tela",
        items: [
          { label: "Tamanho", value: "6,7 polegadas" },
          { label: "Taxa de atualização", value: "144 Hz" },
        ],
      },
      {
        group: "Câmera",
        items: [{ label: "Principal", value: "50 MP com OIS" }],
      },
    ],
    render: {
      body: ["#5f7664", "#313e34"],
      frame: ["#7d9482", "#36443a"],
      screen: ["#0f1c14", "#030805"],
      cameraLayout: "pill",
      cameraCount: 2,
      cutout: "punch",
      light: false,
    },
    photos: [],
    stock: 22,
    featured: 58,
  },
  {
    slug: "fones-pro-anc",
    name: "Fones Pro ANC",
    brand: "Acessórios",
    category: "acessorios",
    tagline: "Silêncio sob demanda.",
    description:
      "Cancelamento ativo adaptativo, áudio espacial com rastreamento de " +
      "cabeça e 32 horas de autonomia com o estojo.",
    price: 1899,
    compareAtPrice: 2299,
    installments: 10,
    colors: [
      { name: "Branco", swatch: ["#f5f5f3", "#d2d2cd"] },
      { name: "Grafite", swatch: ["#3a3a3d", "#161618"] },
    ],
    storage: [{ label: "Único", priceDelta: 0 }],
    highlights: [
      { label: "ANC", value: "Adaptativo", detail: "Ajusta-se ao ambiente" },
      { label: "Autonomia", value: "32 h", detail: "Com o estojo de carga" },
      { label: "Áudio", value: "Espacial", detail: "Com rastreamento de cabeça" },
      { label: "Resistência", value: "IPX4", detail: "Suor e respingos" },
    ],
    specs: [
      {
        group: "Áudio",
        items: [
          { label: "Driver", value: "11 mm, alcance dinâmico alto" },
          { label: "Codecs", value: "AAC, SBC, LC3" },
        ],
      },
    ],
    render: {
      body: ["#f5f5f3", "#d2d2cd"],
      frame: ["#fafaf8", "#c8c8c3"],
      screen: ["#e8e8e4", "#cfcfc9"],
      cameraLayout: "circle",
      cameraCount: 1,
      cutout: "none",
      light: true,
    },
    photos: [],
    stock: 40,
    featured: 46,
  },
  {
    slug: "carregador-gan-140w",
    name: "Carregador GaN 140 W",
    brand: "Acessórios",
    category: "acessorios",
    tagline: "Três aparelhos. Um tomada.",
    description:
      "Nitreto de gálio em um corpo do tamanho de um cartão. Duas portas " +
      "USB-C e uma USB-A, com distribuição inteligente de carga.",
    price: 549,
    installments: 6,
    colors: [{ name: "Branco", swatch: ["#f6f6f4", "#d8d8d3"] }],
    storage: [{ label: "Único", priceDelta: 0 }],
    highlights: [
      { label: "Potência", value: "140 W", detail: "Total distribuída" },
      { label: "Portas", value: "3", detail: "2× USB-C, 1× USB-A" },
      { label: "Tecnologia", value: "GaN III", detail: "Menor e mais frio" },
      { label: "Padrão", value: "PD 3.1", detail: "Power Delivery" },
    ],
    specs: [
      {
        group: "Elétrico",
        items: [
          { label: "Entrada", value: "100–240 V, bivolt" },
          { label: "Saída máxima", value: "140 W (USB-C 1)" },
        ],
      },
    ],
    render: {
      body: ["#f6f6f4", "#d8d8d3"],
      frame: ["#fbfbf9", "#d0d0ca"],
      screen: ["#eeeeea", "#dcdcd6"],
      cameraLayout: "circle",
      cameraCount: 1,
      cutout: "none",
      light: true,
    },
    photos: [],
    stock: 0,
    featured: 28,
  },
  {
    slug: "capa-titanio-magnetica",
    name: "Capa Titânio Magnética",
    brand: "Acessórios",
    category: "acessorios",
    tagline: "Proteção que não engorda.",
    description:
      "Estrutura em titânio escovado com forro de microfibra e alinhamento " +
      "magnético para carregamento sem fio.",
    price: 429,
    installments: 6,
    colors: [
      { name: "Titânio", swatch: ["#c6c0b6", "#8d877f"] },
      { name: "Grafite", swatch: ["#3c3c3f", "#18181a"] },
    ],
    storage: [{ label: "Único", priceDelta: 0 }],
    highlights: [
      { label: "Material", value: "Titânio", detail: "Escovado, grau 2" },
      { label: "Magnético", value: "Sim", detail: "Alinhamento para carga sem fio" },
      { label: "Queda", value: "2 m", detail: "Certificada em laboratório" },
      { label: "Peso", value: "38 g", detail: "Acréscimo sobre o aparelho" },
    ],
    specs: [
      {
        group: "Compatibilidade",
        items: [{ label: "Modelos", value: "Linha Pro e Pro Max" }],
      },
    ],
    render: {
      body: ["#c6c0b6", "#8d877f"],
      frame: ["#dcd7cd", "#857f77"],
      screen: ["#bdb7ad", "#948e86"],
      cameraLayout: "square",
      cameraCount: 3,
      cutout: "none",
      light: true,
    },
    photos: [],
    stock: 31,
    featured: 22,
  },
];

/* ────────────────────────────── selectors ────────────────────────────── */

export const getProduct = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const featuredProducts = (limit = 6): Product[] =>
  [...products]
    .sort((a, b) => (b.featured ?? 0) - (a.featured ?? 0))
    .slice(0, limit);

/** The product that carries the hero and the scroll showcase. */
export const heroProduct = (): Product => products[0];

export const onSale = (): Product[] =>
  products.filter((p) => p.compareAtPrice !== undefined);

export const brands = (): string[] => [
  ...new Set(products.map((p) => p.brand)),
];

export const discountPercent = (p: Product): number | null =>
  p.compareAtPrice
    ? Math.round((1 - p.price / p.compareAtPrice) * 100)
    : null;

/** Lowest price across storage tiers (always the base) plus the top tier. */
export const priceRange = (p: Product): [number, number] => {
  const deltas = p.storage.map((s) => s.priceDelta);
  return [p.price, p.price + Math.max(...deltas)];
};

/** Naive but effective client-side search over name, brand and tagline. */
export const searchProducts = (query: string): Product[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return products
    .map((p) => {
      const haystack =
        `${p.name} ${p.brand} ${p.tagline} ${p.category}`.toLowerCase();
      const score = terms.reduce(
        (acc, t) => acc + (haystack.includes(t) ? 1 : 0),
        0,
      );
      return { p, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.p.featured ?? 0) - (a.p.featured ?? 0))
    .map(({ p }) => p);
};
