export const restaurant = {
  nome: "Donburi",
  nomeCompleto: "Donburi Cozinha Nikkei",
  bairro: "Águas Claras",
  cidade: "Brasília - DF",
  endereco: "R. Babaçú, 25 - Águas Claras, Brasília - DF, 71928-720",
  telefone: "(61) 98404-7137",
  telefoneWhatsapp: "5561984047137",
  nota: 4.7,
  totalAvaliacoes: 2203,
  totalAvaliacoesLabel: "2,2 mil",
  faixaPreco: { min: 40, max: 120 },
  culinaria: "Asiática · Cozinha Nikkei",
  horarioHoje: { abre: "11:30", fecha: "22:30" },
  caracteristicas: [
    "Mesas externas",
    "Opções vegetarianas",
    "Cães podem ficar na área externa",
  ],
  ticketMedioInformadoPor: 1030,
} as const;

export const depoimentos = [
  {
    nome: "Marina A.",
    nota: 5,
    texto:
      "O donburi de salmão maçaricado é surreal. Ambiente lindo, atendimento rápido mesmo lotado.",
  },
  {
    nome: "Rafael C.",
    nota: 5,
    texto:
      "Melhor nikkei de Águas Claras, sem dúvida. O combinado vale cada centavo e o delivery chega quentinho.",
  },
  {
    nome: "Bia S.",
    nota: 4,
    texto:
      "Trouxe o cachorro e sentamos na área externa, super tranquilo. Temaki vegetariano surpreendeu.",
  },
] as const;
