# Árvores de decisão e mapa de integrações

Leia este arquivo quando a triagem da Fase 0 não se resolver de imediato, ou quando
precisar traduzir a integração pedida pelo cliente em nó do n8n.

---

## 1. Agente ou automação? (árvore completa)

```
Os passos são sempre os mesmos, na mesma ordem?
├── SIM → Algum passo exige julgamento (classificar, resumir, redigir, extrair de texto solto)?
│         ├── NÃO  → AUTOMAÇÃO PURA          Padrão A
│         └── SIM  → AUTOMAÇÃO + NÓ DE IA    Padrão B   ← maioria dos casos reais
│
└── NÃO → O sistema precisa escolher quais passos dar a cada execução?
          ├── NÃO → provavelmente são 2–3 fluxos distintos disfarçados de um.
          │         Separe e resolva cada um pelo ramo de cima.
          └── SIM → AGENTE                   Padrão C / Hermes
                    │
                    └── Precisa de memória entre sessões e vários canais,
                        sem começo e fim definidos?
                        ├── SIM → HERMES
                        └── NÃO → AGENTE NO n8n
```

**Dois testes rápidos que resolvem quase toda dúvida:**

- *Teste do fluxograma*: se você consegue desenhar o processo inteiro num fluxograma sem
  caixinha de "depende", é automação.
- *Teste da variação*: se rodar duas vezes com a mesma entrada deve dar exatamente o mesmo
  resultado, é automação. Agente é não-determinístico por construção — quando o cliente
  precisa de reprodutibilidade (financeiro, fiscal, contrato), agente é a escolha errada.

**Sinais de que o cliente pediu agente mas quer automação:** "queria que ele avisasse
quando...", "todo dia de manhã...", "quando entrar um pedido...", "puxar os dados de X e
jogar em Y". Tudo isso é gatilho + passos fixos.

**Sinais de agente de verdade:** "cada caso é diferente", "depende do que o cliente
responder", "ele teria que pesquisar até achar", "tem que entender o contexto".

## 2. n8n ou Hermes?

| Pergunta | n8n | Hermes |
|---|---|---|
| Tem começo e fim definidos? | sim | não, é contínuo |
| Precisa de memória entre sessões? | opcional, por sessão | sim, é o ponto forte |
| Atende em vários canais ao mesmo tempo? | um por workflow | sim, um agente várias superfícies |
| Cliente precisa auditar passo a passo? | sim, aba de execuções | limitado |
| Integra com muitos sistemas via conector pronto | sim, centenas de nós | via MCP e terminal |
| Automação (sem IA) | sim | **não faz** |

Arquitetura combinada, quando fizer sentido: **Hermes pensa, n8n executa.** O Hermes chama
workflows do n8n por webhook como ferramentas. Você fica com o raciocínio contínuo e memória
de um lado, e integrações auditáveis do outro.

## 3. Qual nó usar — do vocabulário do cliente para o n8n

O catálogo comercial da casa (`clinica-estetica/src/lib/agent-catalog.ts`) descreve
integrações em linguagem de negócio. Tradução:

| Cliente diz | Nó do n8n |
|---|---|
| CRM (RD Station, Pipedrive, HubSpot) | nó dedicado se existir, senão `httpRequest` |
| ERP / sistema interno | `httpRequest` (quase sempre) ou `postgres`/`mySql` |
| Planilhas | `googleSheets` / `microsoftExcel` |
| WhatsApp | `httpRequest` para a API oficial ou provedor (Z-API, Evolution); `webhook` para receber |
| E-mail | `gmail`, `microsoftOutlook`, ou `emailSend`/`emailReadImap` |
| E-mail marketing | `httpRequest` para a API da ferramenta |
| Meta Ads / Google Ads | `facebookGraphApi` / `googleAds`, senão `httpRequest` |
| Google Analytics | `googleAnalytics` |
| Calendário / agendamentos | `googleCalendar`, `microsoftOutlook`, ou API do Calendly |
| Banco de dados | `postgres`, `mySql`, `mongoDb` |
| Leitura de PDF / OCR | `extractFromFile`; OCR via `httpRequest` para serviço externo |
| Gerar PDF (proposta, contrato, DRE) | `httpRequest` para serviço de PDF, ou `html` → conversão |
| Assinatura eletrônica | `httpRequest` (Clicksign, D4Sign, DocuSign) |
| Notion / Airtable | `notion` / `airtable` |
| Chat interno | `slack`, `discord`, `telegram` |
| Help desk / service desk | nó dedicado se existir, senão `httpRequest` |
| Gateway de pagamento | `httpRequest` (Stripe, Asaas, Pagar.me) |
| Fontes públicas, diários oficiais, portais | `httpRequest` + parsing; scraping pesado via `browser`/serviço externo |
| Base de conhecimento própria (RAG) | `vectorStorePGVector` / `vectorStoreQdrant` + `embeddingsOpenAi` |
| Transcrição de reunião | `httpRequest` (Whisper) ou nó do provedor |

Regra: **na ausência de nó dedicado, `httpRequest` é a resposta certa** — não um nó
inventado. Antes de afirmar que existe nó dedicado para um serviço, confirme; nome errado
quebra a importação.

## 4. Quando NÃO automatizar

Recusar (ou reduzir o escopo) também é trabalho de desenvolvedor sênior. Sinais:

- **O processo ainda não existe direito.** Automatizar processo confuso produz confusão mais
  rápida. Primeiro o processo em papel, depois a automação.
- **Volume baixo demais.** Três vezes por mês, dez minutos cada: manutenção vai custar mais
  que o ganho. Diga isso — vale mais crédito do que a venda.
- **A ação é irreversível e o erro é caro** (pagamento, envio a órgão público, exclusão).
  Automatize a preparação e deixe o clique final com o humano.
- **Os dados estão na cabeça das pessoas.** Sem fonte consultável não existe pilar
  conhecimento, e o agente vai inventar.
- **A fonte não tem API nem exportação estável.** Scraping de sistema que muda de layout é
  dívida recorrente; deixe explícito no contrato ou não faça.
