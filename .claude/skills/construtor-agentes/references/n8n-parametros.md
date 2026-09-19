# n8n — o `parameters` de cada nó

`references/n8n.md` diz **qual** nó usar. Este arquivo trata do que vai dentro de
`parameters`, que é onde a construção à mão realmente trava: o formato muda entre
`typeVersion` e nenhuma lista decorada é confiável por muito tempo.

## A regra que resolve isso de vez

**A fonte de verdade é a instância do cliente, não a memória de ninguém.** Monte o nó uma
vez na interface do n8n, selecione-o e copie com `Ctrl+C` — o n8n põe no clipboard o JSON
válido daquele nó, com `type`, `typeVersion` e `parameters` exatos para aquela versão.
`Ctrl+V` no canvas cola de volta. É o caminho mais rápido e o único que não erra.

Ordem de preferência para descobrir um `parameters`:

1. **Copiar da interface** (`Ctrl+C` no nó) — ground truth.
2. **MCP do n8n**, se o conector estiver autorizado — consulta o schema direto na instância.
3. **A tabela abaixo** — ponto de partida para os nós mais comuns, sujeita a conferência.
4. **Perguntar.** Nunca completar de cabeça.

Se você escreveu um `parameters` pelo caminho 3, **diga isso na entrega**: *"os campos dos
nós X e Y seguem o formato da versão N; confirme na sua instância antes de ativar."* Campo
errado não quebra a importação — o nó entra com o campo vazio e falha só na execução, que é
o pior momento para descobrir.

`options: {}` existe em quase todo nó e pode ficar vazio. Todo valor que começa com `=` é
expressão.

---

## Gatilhos

**`n8n-nodes-base.webhook`** (v2)
```json
{ "httpMethod": "POST", "path": "lead-whatsapp", "responseMode": "responseNode", "options": {} }
```
`responseMode`: `onReceived` (responde 200 na hora), `lastNode`, ou `responseNode` (exige um
nó `respondToWebhook` no fluxo).

**`n8n-nodes-base.scheduleTrigger`** (v1.2)
```json
{ "rule": { "interval": [{ "field": "hours", "hoursInterval": 1 }] } }
```
`field`: `seconds` | `minutes` | `hours` | `days` | `weeks` | `months` | `cronExpression`.
Horário fixo diário: `{ "field": "days", "triggerAtHour": 8, "triggerAtMinute": 0 }`.
Dia fixo do mês (fechamento contábil, relatório mensal):
`{ "field": "months", "triggerAtDayOfMonth": 1, "triggerAtHour": 7, "triggerAtMinute": 0 }`.

**`n8n-nodes-base.errorTrigger`** (v1) — `{}`. Sem parâmetro nenhum. Ele dispara quando outro
workflow falha; o workflow que falhou aponta para este em Settings → Error Workflow.

**`@n8n/n8n-nodes-langchain.chatTrigger`** (v1.1) — `{ "public": false, "options": {} }`

---

## Lógica e dados

**`n8n-nodes-base.set`** (v3.4) — o formato mudou bastante da v2; confira a versão.
```json
{
  "assignments": {
    "assignments": [
      { "id": "1", "name": "email", "value": "={{ $json.body.email }}", "type": "string" }
    ]
  },
  "options": {}
}
```
`type`: `string` | `number` | `boolean` | `array` | `object`.

**`n8n-nodes-base.if`** (v2)
```json
{
  "conditions": {
    "options": { "caseSensitive": true, "version": 2 },
    "combinator": "and",
    "conditions": [
      {
        "id": "1",
        "leftValue": "={{ $json.score }}",
        "rightValue": 70,
        "operator": { "type": "number", "operation": "gte" }
      }
    ]
  },
  "options": {}
}
```
`operator.type`: `string` | `number` | `boolean` | `dateTime` | `array` | `object`.
`operation` por tipo: string → `equals`, `contains`, `startsWith`, `exists`, `notEmpty`;
número → `gt`, `gte`, `lt`, `lte`, `equals`. Saída 0 = true, saída 1 = false.

**`n8n-nodes-base.switch`** (v3) — `rules.values[]`, cada um com `conditions` no mesmo
formato do IF mais `outputKey`. A ordem das regras é a ordem das saídas.

**`n8n-nodes-base.code`** (v2)
```json
{ "mode": "runOnceForAllItems", "jsCode": "return items.map(i => ({ json: { ...i.json } }));" }
```
`mode`: `runOnceForAllItems` (usa `items`) | `runOnceForEachItem` (usa `item`).

**`n8n-nodes-base.splitInBatches`** (v3) — `{ "batchSize": 10, "options": {} }`
**`n8n-nodes-base.aggregate`** (v1) — `{ "aggregate": "aggregateAllItemData", "options": {} }`
**`n8n-nodes-base.wait`** (v1.1) — `{ "amount": 5, "unit": "minutes" }`
**`n8n-nodes-base.respondToWebhook`** (v1.1) — `{ "respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {} }`

---

## Ação

**`n8n-nodes-base.httpRequest`** (v4.2) — o curinga.
```json
{
  "method": "POST",
  "url": "https://api.exemplo.com/mensagens",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={{ JSON.stringify({ para: $json.telefone, texto: $json.resposta }) }}",
  "options": {}
}
```
Sem autenticação, omita `authentication` e `genericAuthType`. Query string: `sendQuery: true`
+ `queryParameters.parameters[]` com `{name, value}`. Nunca escreva o token aqui — use
credencial. Para tolerar falha da fonte: `"options": { "response": { "response": { "neverError": true } } }`.

**Resource locator (`__rl`)** — nós do Google e afins não recebem o id direto:
```json
"documentId": { "__rl": true, "mode": "id", "value": "1AbC..." }
```
**Os modos aceitos dependem do campo**, não são uma lista única. `documentId` e `calendar`
aceitam `id` | `url` | `list`; `sheetName` aceita `name` (o nome da aba) além de `id`/`list`;
`channelId` do Slack aceita `name` (`#alertas`). Na dúvida, copie o nó da interface e veja o
`mode` que ele gravou. Para entrega, evite `list`: ele guarda o cache da *sua* instância e
não resolve na do cliente.

**`n8n-nodes-base.googleSheets`** (v4.5)
```json
{
  "operation": "append",
  "documentId": { "__rl": true, "mode": "id", "value": "PREENCHER" },
  "sheetName":  { "__rl": true, "mode": "name", "value": "Leads" },
  "columns": { "mappingMode": "autoMapInputData", "matchingColumns": [] },
  "options": {}
}
```
`operation`: `append` | `read` | `update` | `appendOrUpdate` | `delete`.

**`n8n-nodes-base.googleCalendar`** (v1.3)
```json
{
  "operation": "create",
  "calendar": { "__rl": true, "mode": "id", "value": "PREENCHER" },
  "start": "={{ $json.inicio }}",
  "end":   "={{ $json.fim }}",
  "additionalFields": { "summary": "Avaliação — {{ $json.nome }}" }
}
```
`operation`: `create` | `get` | `getAll` | `update` | `delete`. Para checar conflito antes de
marcar, use `getAll` com `timeMin`/`timeMax` em `options`.

**`n8n-nodes-base.gmail`** — envio (v2.1):
`{ "sendTo": "...", "subject": "...", "message": "...", "options": {} }`

Gmail em **leitura**, que é o que um fluxo de "nota fiscal que chega por e-mail" precisa:
```json
{
  "resource": "message",
  "operation": "getAll",
  "returnAll": false,
  "limit": 50,
  "filters": { "q": "has:attachment from:fornecedor.com after:2026/09/01" },
  "options": { "downloadAttachments": true }
}
```
`filters.q` usa a sintaxe de busca do próprio Gmail. `downloadAttachments` traz o anexo como
binário para o nó seguinte — sem ele, você recebe só os metadados.

**`n8n-nodes-base.extractFromFile`** (v1) — lê o binário que veio do e-mail ou do download:
```json
{ "operation": "pdf", "binaryPropertyName": "data", "options": {} }
```
`operation`: `pdf` | `csv` | `xlsx` | `ods` | `text` | `html` | `xml` | `fromJson`.
`binaryPropertyName` é o nome da propriedade binária produzida pelo nó anterior (`data` é o
padrão do Gmail; com vários anexos vira `attachment_0`, `attachment_1`, …).
**`n8n-nodes-base.slack`** (v2.2) — `{ "select": "channel", "channelId": {"__rl": true, "mode": "name", "value": "#alertas"}, "text": "...", "otherOptions": {} }`
**`n8n-nodes-base.postgres`** (v2.5)
```json
{
  "operation": "executeQuery",
  "query": "SELECT * FROM notas WHERE cnpj = $1 AND competencia = $2",
  "options": { "queryReplacement": "={{ $json.cnpj }},={{ $json.competencia }}" }
}
```
`queryReplacement` fica dentro de `options`, com os valores separados por vírgula na ordem
de `$1`, `$2`, … Nunca concatene expressão dentro do SQL: além de quebrar com aspas no dado,
é injeção.

---

## IA

**`@n8n/n8n-nodes-langchain.agent`** (v1.7)
```json
{ "promptType": "auto", "options": { "systemMessage": "..." } }
```
Com webhook: `"promptType": "define"` + `"text": "={{ $json.body.message.text }}"`.

**`@n8n/n8n-nodes-langchain.lmChatOpenAi`** (v1.2) — `{ "model": "gpt-4.1-mini", "options": {} }`
**`@n8n/n8n-nodes-langchain.lmChatAnthropic`** (v1.3) — `{ "model": "claude-sonnet-4-5", "options": {} }`
**`@n8n/n8n-nodes-langchain.memoryBufferWindow`** (v1.3) — `{ "contextWindowLength": 10 }`.
Com webhook (não chat), fixe a chave de sessão: `"sessionIdType": "customKey"`,
`"sessionKey": "={{ $json.body.telefone }}"` — sem isso, conversas de clientes diferentes se
misturam.

**`@n8n/n8n-nodes-langchain.toolHttpRequest`** (v1.1)
```json
{
  "toolDescription": "Use quando o cliente perguntar horário disponível para avaliação.",
  "url": "https://api.exemplo.com/horarios",
  "sendQuery": true,
  "parametersQuery": { "values": [{ "name": "data", "valueProvider": "modelRequired" }] },
  "options": {}
}
```
`valueProvider`: `modelRequired` (o modelo preenche, obrigatório) | `modelOptional` |
`fieldValue` (valor fixo).

**`@n8n/n8n-nodes-langchain.toolWorkflow`** (v2)
```json
{
  "description": "Use para agendar a avaliação depois que o cliente confirmar o horário.",
  "workflowId": { "__rl": true, "mode": "id", "value": "PREENCHER" },
  "workflowInputs": { "mappingMode": "defineBelow", "value": {} }
}
```
`workflowId` vazio faz o agente não conseguir chamar a ferramenta — o validador trata isso
como erro. Em entrega com sub-workflows, importe-os **primeiro**, anote os ids e preencha;
se não der, documente como passo obrigatório pós-importação, com o id a preencher.

**`@n8n/n8n-nodes-langchain.chainLlm`** (v1.4)
```json
{ "promptType": "define", "text": "={{ $json.textoDaNota }}", "hasOutputParser": true }
```
**`hasOutputParser: true` é obrigatório para que a porta `ai_outputParser` exista.** Sem o
flag, você liga o parser no `connections`, o JSON importa, e o parser simplesmente não
binda — a saída volta em texto livre e o Switch seguinte cai sempre no fallback. O mesmo
flag vale para o nó `agent`. O validador trata a ausência como erro.
**`@n8n/n8n-nodes-langchain.outputParserStructured`** (v1.2) — `{ "schemaType": "manual", "inputSchema": "{\"type\":\"object\",\"properties\":{...}}" }`

---

## Versões

Os números acima são os que estavam correntes quando este arquivo foi escrito. Se a
instância do cliente for mais antiga, **o `typeVersion` que ela conhece é o que vale** — o
n8n aceita versão antiga e faz upgrade na importação, mas recusa versão que ele não conhece.
Na dúvida entre duas, a menor é a aposta segura.
