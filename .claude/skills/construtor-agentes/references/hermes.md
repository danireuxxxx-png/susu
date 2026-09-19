# Hermes — referência de construção

Leia este arquivo quando a plataforma escolhida for Hermes.

O Hermes (Nous Research) é um **agente autônomo open-source**, não uma ferramenta de
automação. Ele roda na infraestrutura do cliente, mantém memória persistente entre sessões,
decide os próprios passos e atende por vários canais (CLI, Telegram, Discord, Slack,
WhatsApp, Signal, e-mail). Se o pedido for "quando acontecer X, faça Y" com passos fixos,
**não é caso de Hermes** — volte para n8n.

## Índice
1. Layout de `~/.hermes/`
2. Perfis — um perfil por agente
3. SOUL.md — onde vivem os 5 pilares
4. config.yaml
5. Toolsets (ferramentas e limites)
6. Skills — o conhecimento sob demanda
7. Memória
8. Cron
9. Entrega e armadilhas

---

## 1. Layout de `~/.hermes/`

```
~/.hermes/
├── config.yaml     modelo, terminal, compressão, memória, skills
├── .env            chaves de API e segredos (nunca no config.yaml)
├── auth.json       credenciais OAuth
├── SOUL.md         identidade do agente — o system prompt principal
├── memories/       memória persistente (MEMORY.md, USER.md)
├── skills/         skills do agente (progressive disclosure)
├── cron/           tarefas agendadas
├── sessions/       sessões do gateway
├── logs/           logs (segredos são redigidos automaticamente)
└── state.db        SQLite: sessões, mensagens, roteamento
```

Precedência de configuração, do maior para o menor: argumento de CLI → `config.yaml` →
`.env` → padrão embutido. Convenção de nome: chave em `UPPER_SNAKE` vai para `.env`
(segredo); chave com ponto vai para `config.yaml` (configuração).

## 2. Perfis — um perfil por agente

Cada agente entregue ao cliente deve ser **um perfil próprio**. Perfil é um diretório
`~/.hermes/profiles/<nome>/` isolado, com seu próprio `config.yaml`, `.env`, `SOUL.md`,
memória, sessões, skills e cron.

```bash
hermes profile create sdr          # cria o perfil e um alias de comando "sdr"
hermes -p sdr chat                 # usa o perfil explicitamente
```

Isolar por perfil é o que evita o erro mais caro do Hermes: dois agentes compartilhando
memória e começando a responder com o contexto um do outro — do cliente errado, inclusive.

## 3. SOUL.md — onde vivem os 5 pilares

É o arquivo mais importante. Ele carrega em **toda** sessão, então precisa ser curto e
denso: tudo que não for necessário sempre deve virar skill (seção 6), não linha de SOUL.

Mapeamento direto:

| Pilar | Seção do SOUL.md |
|---|---|
| Objetivo | `# Papel` e `## O que você entrega` |
| Conhecimento | `## Onde buscar informação` (ponteiros, não o conteúdo) |
| Ferramentas | `## Ferramentas` — e os toolsets habilitados no config |
| Processos | `## Como decidir` |
| Limites | `## Nunca faça` e `## Quando escalar` |

Use `templates/SOUL.md` como base. Regras de escrita:

- **Segunda pessoa, imperativo.** "Você atende..." / "Confirme antes de...".
- **Curto.** Mire em 40–80 linhas. SOUL longo dilui: o modelo passa a tratar tudo como
  ruído de fundo e obedece menos, não mais.
- **Limites com número.** "Nunca ofereça desconto acima de 10%" funciona; "seja prudente
  com descontos" não funciona.
- **Nada de segredo.** Chave e token vão para `.env`.

## 4. config.yaml

Estrutura real (subconjunto relevante; o resto tem padrão razoável e pode ficar de fora):

```yaml
model:
  streaming: true

agent:
  max_turns: none
  session_stall_timeout: 300
  verify_on_stop: false

context:
  engine: "compressor"

compression:
  enabled: true
  threshold: 0.50
  target_ratio: 0.20
  tail_mode: lean

skills:
  auto_load: []            # skills sempre carregadas (use com parcimônia)
  guard_agent_created: false
  write_approval: false    # true = agente pede aprovação para escrever skill

memory:
  memory_enabled: true
  write_approval: false    # true = agente pede aprovação para gravar memória

terminal:
  backend: local
  cwd: "."
  timeout: 180

prompt_caching:
  ttl_tier: "1h"
```

Para agente que atende cliente final, considere `memory.write_approval: true` e
`skills.write_approval: true` na v1: você vê o que ele está aprendendo antes de virar
permanente. Depois de algumas semanas de acerto, solte.

## 5. Toolsets — ferramentas e limites na prática

Toolsets disponíveis:

`web`, `search`, `terminal`, `file`, `browser`, `vision`, `image_gen`, `skills`, `tts`,
`todo`, `memory`, `session_search`, `cronjob`, `code_execution`, `delegation`, `clarify`,
`homeassistant`, `messaging`, `spotify`, `discord`, `discord_admin`, `debugging`, `safe`.

Ferramentas dentro deles: `web_search`, `web_extract`, `x_search`, `terminal`, `process`,
`read_file`, `patch`, `browser_navigate`, `browser_snapshot`, `browser_vision`,
`vision_analyze`, `image_generate`, `text_to_speech`, `todo`, `clarify`, `execute_code`,
`delegate_task`, `memory`, `session_search`, `cronjob`. Servidores MCP entram como
toolsets dinâmicos `mcp-<servidor>`.

```bash
hermes chat --toolsets "web,search,messaging"   # só o necessário nesta execução
hermes tools                                    # configuração interativa por instalação
```

**O pilar "limites" se implementa aqui, não só no texto do SOUL.** Toolset que não for
estritamente necessário fica desabilitado — instrução em linguagem natural pode ser
contornada, ferramenta ausente não pode. Para um agente que só lê e responde, `terminal`,
`code_execution` e `file` não deveriam estar ligados. Habilite `clarify` sempre que o
agente falar com cliente final: é o toolset que permite a ele perguntar em vez de supor.

## 6. Skills — o conhecimento sob demanda

Skill é documento de conhecimento carregado só quando necessário (progressive disclosure),
compatível com o padrão aberto agentskills.io. É onde vai o pilar **conhecimento** que não
cabe no SOUL: tabela de preços, script de objeções, política de reembolso, procedimento de
onboarding.

```
~/.hermes/skills/<categoria>/<nome>/
├── SKILL.md          obrigatório
├── references/       documentos por tópico
├── templates/        formatos de saída
├── scripts/          auxiliares
└── assets/
```

Frontmatter:

```yaml
---
name: politica-comercial
description: Regras de preço, desconto e prazo   # curto, ≤ 60 caracteres
version: 1.0.0
metadata:
  hermes:
    tags: [comercial, precos]
    category: vendas
    requires_toolsets: [web]      # opcional
---
```

Como criar: skills pessoais do agente vão por `skill_manage(action='create')`, que grava em
`~/.hermes/skills/`. Skills versionadas em repositório (`skills/<categoria>/<nome>/SKILL.md`)
são criadas com `write_file` + `git add` — `skill_manage` **não** escreve nessa árvore.
Para entrega a cliente, versione no repositório: skill que só existe na máquina do agente
some quando a máquina some.

O agente também cria skills sozinho depois de resolver um problema não trivial — é a memória
procedural dele. Com `skills.write_approval: true`, isso passa por você antes.

## 7. Memória

Memória embutida fica em `memories/` (`MEMORY.md`, `USER.md`) e é o que dá continuidade
entre sessões. Há plugins externos de memória (Honcho, Mem0, Supermemory, entre outros) que
acrescentam grafo de conhecimento, busca semântica e extração automática de fatos — só
proponha um deles quando o volume justificar; para a maioria dos agentes de PME, a memória
embutida basta e é uma dependência a menos para o cliente manter.

## 8. Cron

O toolset `cronjob` (e `~/.hermes/cron/`) agenda execuções recorrentes. Útil para o agente
fazer a varredura da manhã e mandar o resumo no Telegram.

Atenção ao limite da plataforma: se o caso for **só** "todo dia às 8h faça estes passos
fixos", isso é automação e pertence ao n8n. Cron no Hermes se justifica quando a tarefa
agendada exige julgamento e memória do que já foi visto antes.

## 9. Entrega e armadilhas

Entregue como um pacote versionado no repositório do cliente:

```
agentes/<nome-do-agente>/
├── SOUL.md
├── config.yaml
├── .env.example        nomes das variáveis, sem valores
├── skills/
└── README.md           como instalar, canais, o que ele faz e não faz
```

| Sintoma | Causa |
|---|---|
| Agente responde com contexto de outro cliente | agentes compartilhando o mesmo perfil |
| Ignora as regras do SOUL | SOUL longo demais; mova conhecimento para skills |
| Faz coisa que não devia | limite escrito no SOUL mas toolset continua habilitado |
| Esquece entre sessões | `memory.memory_enabled: false` ou perfil trocado |
| Custo alto | toolsets demais ligados, `skills.auto_load` carregando skill sempre |
| Inventa dado | falta ponteiro de fonte no SOUL e falta `clarify` habilitado |
