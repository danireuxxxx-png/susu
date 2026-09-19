# construtor-agentes

Skill do Claude Code para projetar e construir agentes de IA e automações no **n8n**
(agentes e automações) e no **Hermes** (somente agentes).

## Como usar

Basta descrever o caso em qualquer sessão do Claude Code neste repositório:

> "Cliente quer um agente que responda os leads do WhatsApp e marque avaliação"

A skill dispara sozinha. Para forçar, use `/construtor-agentes`.

## O que ela faz

```
Fase 0  Triagem       → agente ou automação? n8n ou Hermes?
Fase 1  Diagnóstico   → as 5 perguntas
Fase 2  Especificação → os 5 pilares  ← portão: precisa de aprovação
Fase 3  Construção    → workflow JSON / SOUL.md + config
Fase 4  Entrega       → validação, credenciais, plano de teste, riscos
```

Os **5 pilares**: objetivo, conhecimento, ferramentas, processos, limites.
As **5 perguntas**: qual problema resolve, qual departamento, quais informações precisa,
quais ferramentas pode usar, quais decisões toma sozinho.

## Estrutura

```
construtor-agentes/
├── SKILL.md                    processo completo (sempre carregado quando dispara)
├── references/
│   ├── n8n.md                  nós, JSON do workflow, padrões, armadilhas
│   ├── n8n-parametros.md       o 'parameters' de cada nó + como obter o schema real
│   ├── hermes.md               SOUL.md, config.yaml, toolsets, skills, cron
│   └── decisao.md              árvores de decisão e mapa integração → nó
├── templates/
│   ├── especificacao.md        a especificação dos 5 pilares
│   ├── n8n-workflow.json       esqueleto de agente que importa direto no n8n
│   └── SOUL.md                 identidade do agente Hermes
└── scripts/
    └── validar_n8n.py          valida o workflow antes da entrega
```

Os arquivos de `references/` só entram no contexto quando são necessários — construir no
n8n não carrega a referência do Hermes e vice-versa.

## Validador

```bash
RAIZ="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
python3 "$RAIZ/.claude/skills/construtor-agentes/scripts/validar_n8n.py" workflow.json
```

Pega: JSON inválido, conexão para nó inexistente, **expressão `$('Nome')` apontando para nó
renomeado**, agente sem modelo de linguagem, ferramenta `toolWorkflow` sem `workflowId`, nó
órfão, nome/id duplicado, ferramenta sem descrição, LLM alimentando IF/Switch sem output
parser, `executionOrder` ausente, credencial com id local e segredo esquecido no arquivo —
inclusive dentro de expressão. Código de saída 1 quando há erro, então dá para usar em CI.

Ele **não** verifica os campos dentro de `parameters`: isso só a instância do n8n sabe, e
`references/n8n-parametros.md` explica como obter o schema verdadeiro.

## Integração com o catálogo comercial

Antes de especificar do zero, a skill procura ficha correspondente em
`clinica-estetica/src/lib/agent-catalog.ts` (58 agentes). Isso mantém o que foi vendido
igual ao que é entregue.

## n8n via MCP

Há um servidor MCP do n8n disponível na sessão, mas ele **precisa ser autorizado** em
`/mcp` (sessão interativa) ou nas configurações de conectores do claude.ai. Autorizado, a
skill oferece subir o workflow direto na instância em vez de entregar o arquivo para
importar na mão.
