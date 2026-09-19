# n8n — referência de construção

Leia este arquivo quando a plataforma escolhida for n8n.

## Índice
1. Anatomia do workflow JSON
2. Conexões (inclusive as de IA)
3. Catálogo de nós por função
4. Padrão A — automação determinística
5. Padrão B — automação com um nó de IA
6. Padrão C — agente com ferramentas
7. Expressões e passagem de dados
8. Credenciais
9. Armadilhas que quebram na importação ou em produção

---

## 1. Anatomia do workflow JSON

O arquivo que o n8n importa tem esta forma. `nodes` e `connections` são obrigatórios;
`settings.executionOrder: "v1"` deve estar presente em workflows novos, senão a ordem de
execução com múltiplos ramos fica imprevisível.

```json
{
  "name": "Qualificação de leads WhatsApp",
  "nodes": [
    {
      "parameters": {},
      "id": "a1b2c3d4-0000-4000-8000-000000000001",
      "name": "Recebe mensagem",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 0]
    }
  ],
  "connections": {
    "Recebe mensagem": {
      "main": [[{ "node": "Classifica lead", "type": "main", "index": 0 }]]
    }
  },
  "settings": { "executionOrder": "v1" },
  "pinData": {}
}
```

Regras do arquivo:

- **`id` de cada nó**: UUID v4. Precisa ser único dentro do workflow. Pode ser gerado.
- **`name`**: é a chave usada em `connections` e nas expressões `$('Nome do nó')`. Único,
  e escrito no vocabulário do negócio.
- **`position`**: `[x, y]`. Espace em ~220px no eixo x para o fluxo ficar legível. Sub-nós
  de IA ficam **abaixo** do nó agente (y maior), não em linha.
- **`typeVersion`**: cada nó tem a sua. Se não tiver certeza da versão na instância do
  cliente, use a menor versão estável conhecida — o n8n aceita versão antiga e faz upgrade,
  mas rejeita versão futura que aquela instância não conhece.

## 2. Conexões

`connections` é indexado pelo **nome do nó de origem**. O valor é um objeto cujas chaves são
o tipo da conexão, e cada tipo é um array de saídas, e cada saída é um array de destinos
(array de array — o nível externo é a porta de saída, o interno são os destinos ligados
naquela porta).

```json
"connections": {
  "Classifica lead": {
    "main": [
      [{ "node": "É quente?", "type": "main", "index": 0 }]
    ]
  },
  "É quente?": {
    "main": [
      [{ "node": "Agenda consulta", "type": "main", "index": 0 }],
      [{ "node": "Manda pra nutrição", "type": "main", "index": 0 }]
    ]
  }
}
```

No `IF`, a primeira saída é **true** e a segunda é **false**. No `Switch`, a ordem das
saídas é a ordem das regras.

### Conexões de IA — a parte que mais se erra

Sub-nós de IA (modelo, memória, ferramenta) **conectam-se de baixo para cima**: a origem é
o **sub-nó**, o destino é o **agente**. É invertido em relação à intuição do fluxo visual.

```json
"connections": {
  "OpenAI Chat Model": {
    "ai_languageModel": [[{ "node": "Agente SDR", "type": "ai_languageModel", "index": 0 }]]
  },
  "Memória da conversa": {
    "ai_memory": [[{ "node": "Agente SDR", "type": "ai_memory", "index": 0 }]]
  },
  "Consulta agenda": {
    "ai_tool": [[{ "node": "Agente SDR", "type": "ai_tool", "index": 0 }]]
  }
}
```

Tipos de sub-conexão: `ai_languageModel`, `ai_memory`, `ai_tool`, `ai_outputParser`,
`ai_embedding`, `ai_vectorStore`, `ai_document`, `ai_textSplitter`, `ai_retriever`.

Todas as ferramentas de um agente usam `index: 0` — várias ferramentas entram na mesma
porta, cada uma como um item a mais no array interno ou como entrada própria em
`connections`. Um agente sem `ai_languageModel` não executa.

## 3. Catálogo de nós por função

Prefixos: nós de base são `n8n-nodes-base.*`; nós de IA/LangChain são
`@n8n/n8n-nodes-langchain.*`.

### Gatilhos
| Nó | Tipo | Quando usar |
|---|---|---|
| Schedule Trigger | `n8n-nodes-base.scheduleTrigger` | rotina por horário (relatório diário, varredura) |
| Webhook | `n8n-nodes-base.webhook` | sistema externo chama o n8n (formulário, WhatsApp, CRM) |
| Chat Trigger | `@n8n/n8n-nodes-langchain.chatTrigger` | interface de chat do próprio n8n (ótimo para testar agente) |
| Execute Workflow Trigger | `n8n-nodes-base.executeWorkflowTrigger` | este workflow é chamado por outro (ou vira ferramenta de agente) |
| Gmail / Telegram / Slack Trigger | `n8n-nodes-base.gmailTrigger`, `.telegramTrigger`, `.slackTrigger` | evento na ferramenta |
| Form Trigger | `n8n-nodes-base.formTrigger` | formulário hospedado pelo n8n |

### Lógica e dados
| Nó | Tipo | Para quê |
|---|---|---|
| IF | `n8n-nodes-base.if` | bifurcação booleana |
| Switch | `n8n-nodes-base.switch` | múltiplos caminhos por regra |
| Set / Edit Fields | `n8n-nodes-base.set` | montar/renomear campos |
| Code | `n8n-nodes-base.code` | transformação que não cabe em Set (JS) |
| Merge | `n8n-nodes-base.merge` | juntar dois ramos |
| Split In Batches / Loop Over Items | `n8n-nodes-base.splitInBatches` | processar em lotes, respeitar rate limit |
| Filter | `n8n-nodes-base.filter` | descartar itens |
| Aggregate | `n8n-nodes-base.aggregate` | muitos itens → um |
| Wait | `n8n-nodes-base.wait` | pausa, espera por webhook, follow-up com atraso |
| Error Trigger | `n8n-nodes-base.errorTrigger` | workflow que trata falha de outro |
| Stop And Error | `n8n-nodes-base.stopAndError` | abortar explicitamente com mensagem |

### Ação e integração
| Nó | Tipo |
|---|---|
| HTTP Request | `n8n-nodes-base.httpRequest` (o curinga: qualquer API sem nó dedicado) |
| Google Sheets | `n8n-nodes-base.googleSheets` |
| Google Calendar | `n8n-nodes-base.googleCalendar` |
| Gmail | `n8n-nodes-base.gmail` |
| Slack / Telegram / Discord | `n8n-nodes-base.slack`, `.telegram`, `.discord` |
| Postgres / MySQL | `n8n-nodes-base.postgres`, `.mySql` |
| Notion / Airtable | `n8n-nodes-base.notion`, `.airtable` |
| Respond to Webhook | `n8n-nodes-base.respondToWebhook` (resposta síncrona ao chamador) |
| Convert to File / Extract from File | `n8n-nodes-base.convertToFile`, `.extractFromFile` (PDF, CSV, binário) |

### IA
| Nó | Tipo | Papel |
|---|---|---|
| AI Agent | `@n8n/n8n-nodes-langchain.agent` | agente com ferramentas (Padrão C) |
| Basic LLM Chain | `@n8n/n8n-nodes-langchain.chainLlm` | uma chamada ao modelo, sem ferramentas (Padrão B) |
| Chat Model (OpenAI) | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | o "cérebro" |
| Chat Model (Anthropic) | `@n8n/n8n-nodes-langchain.lmChatAnthropic` | idem |
| Window Buffer Memory | `@n8n/n8n-nodes-langchain.memoryBufferWindow` | memória de conversa por sessão |
| Structured Output Parser | `@n8n/n8n-nodes-langchain.outputParserStructured` | força saída em JSON com schema |
| Call n8n Workflow Tool | `@n8n/n8n-nodes-langchain.toolWorkflow` | outro workflow vira ferramenta do agente |
| HTTP Request Tool | `@n8n/n8n-nodes-langchain.toolHttpRequest` | API vira ferramenta do agente |
| Code Tool | `@n8n/n8n-nodes-langchain.toolCode` | função JS vira ferramenta |
| Vector Store (Qdrant/PGVector/Pinecone) | `@n8n/n8n-nodes-langchain.vectorStoreQdrant`, `.vectorStorePGVector`, `.vectorStorePinecone` | base de conhecimento (RAG) |
| Embeddings OpenAI | `@n8n/n8n-nodes-langchain.embeddingsOpenAi` | vetorização |

Se um serviço não tem nó dedicado, **não invente um** — use `httpRequest`. É o caminho
correto e sempre funciona.

## 4. Padrão A — automação determinística

```
Schedule Trigger → HTTP Request (busca) → Filter → Set → Google Sheets (grava) → Slack (avisa)
```

Sem IA. Se o caso couber aqui, é aqui que ele deve ficar: custo zero de token, execução em
segundos, resultado idêntico toda vez e cada nó inspecionável na aba de execuções.

## 5. Padrão B — automação com um nó de IA

```
Webhook → Basic LLM Chain (classifica) → Structured Output Parser → Switch → ações
```

O modelo entra só onde há julgamento. Sempre pendure um **Structured Output Parser** no
`chainLlm` quando a saída for alimentar um `Switch` ou `IF`: sem schema, o modelo devolve
texto livre e a comparação do Switch falha de forma intermitente — o pior tipo de bug,
porque passa no teste e quebra na terça-feira.

## 6. Padrão C — agente com ferramentas

```
Chat Trigger ─→ AI Agent ─→ (saída)
                   ↑ ai_languageModel   OpenAI Chat Model
                   ↑ ai_memory          Window Buffer Memory
                   ↑ ai_tool            Consulta agenda (toolHttpRequest)
                   ↑ ai_tool            Registra no CRM (toolWorkflow)
```

Parâmetros do nó `agent`:

```json
{
  "parameters": {
    "promptType": "define",
    "text": "={{ $json.chatInput }}",
    "options": {
      "systemMessage": "Você é ...\n\n## Como decidir\n...\n\n## Nunca faça\n..."
    }
  },
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 1.7
}
```

`promptType: "auto"` pega o campo `chatInput` automaticamente; `"define"` permite montar o
texto com expressão — prefira `"define"` quando a entrada vier de webhook e não de chat.

**O `systemMessage` é onde moram os pilares.** Escreva-o com as seções: papel e objetivo,
como decidir (processos), o que nunca fazer e quando escalar (limites). Cada ferramenta
precisa de uma `description` que diga **quando** usá-la, não o que ela é — o modelo escolhe
a ferramenta lendo essa frase, e descrição ruim é a causa número um de agente que chama a
ferramenta errada.

## 7. Expressões e passagem de dados

- Toda expressão começa com `=` no valor do parâmetro: `"valor": "={{ $json.email }}"`.
- `$json` — item atual. `$json.campo.subcampo`.
- `$('Nome do nó').item.json.campo` — item correspondente de um nó anterior.
- `$('Nome do nó').first().json` / `.all()` — primeiro item / todos.
- `$now`, `$today` — data/hora (Luxon). `$now.minus({ days: 7 }).toISO()`.
- `$execution.id`, `$workflow.id` — identificadores úteis em log.

Cada nó processa **todos os itens** que recebe, um a um. Isso é a fonte de surpresa mais
comum: um nó que retorna 50 itens faz o nó seguinte rodar 50 vezes. Se a intenção era uma
única chamada, use `Aggregate` ou `Limit` antes.

## 8. Credenciais

No JSON, credenciais aparecem por referência, nunca por valor:

```json
"credentials": {
  "openAiApi": { "id": "1", "name": "OpenAI conta cliente" }
}
```

Ao entregar, **remova os `id`** (são locais da sua instância) ou deixe apenas o `name` como
indicação, e liste à parte todas as credenciais que o cliente precisa criar. Nunca escreva
chave, token, senha ou URL interna dentro do arquivo — ele vai circular por e-mail e WhatsApp.

## 9. Armadilhas

| Sintoma | Causa |
|---|---|
| Importa mas o agente não roda | falta a conexão `ai_languageModel` |
| "Unknown node type" na importação | nome do `type` errado ou nó de comunidade não instalado |
| Ramos executam fora de ordem | falta `settings.executionOrder: "v1"` |
| Switch cai sempre no fallback | saída do LLM sem Structured Output Parser |
| Nó executa N vezes sem querer | nó anterior devolveu N itens; falta Aggregate/Limit |
| Conexão ignorada silenciosamente | nome em `connections` não bate exatamente com `name` do nó |
| Rate limit / 429 | falta `splitInBatches` com intervalo, ou retry no nó |
| Agente chama a ferramenta errada | `description` da ferramenta diz o que ela é, não quando usar |
| Falha em silêncio à noite | sem Error Trigger / sem notificação no caminho de erro |

Antes de entregar, rode sempre:

```bash
python3 .claude/skills/construtor-agentes/scripts/validar_n8n.py workflow.json
```
