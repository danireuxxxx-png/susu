# Especificação — [Nome do agente/automação]

> Preencha e envie para aprovação **antes** de construir. Campo que você não souber
> responder é pergunta para o cliente, não suposição para escrever.

| | |
|---|---|
| **Cliente** | |
| **Tipo** | ( ) Automação  ( ) Automação com nó de IA  ( ) Agente |
| **Plataforma** | ( ) n8n  ( ) Hermes  ( ) n8n + Hermes |
| **Departamento** | |
| **Dono do processo** | *quem aprova e quem recebe o resultado* |
| **Ficha do catálogo** | *id em agent-catalog.ts, ou "novo"* |

---

## 1. Objetivo — qual problema resolve

**Situação hoje:**
*Como o problema acontece hoje, com número. Ex.: "chegam ~40 leads/dia no WhatsApp; 30% só
recebem resposta no dia seguinte; a equipe estima perder 1 em cada 4 por demora."*

**O que passa a acontecer:**
*Uma frase, no presente, com o resultado observável.*

**Como sabemos que funcionou:**

| Métrica | Hoje | Meta |
|---|---|---|
| | | |

Se não dá para preencher essa tabela, o objetivo ainda está vago — volte e refaça.

---

## 2. Conhecimento — onde busca as informações

| Informação | Fonte | Acesso | Frescor necessário | Se a fonte falhar |
|---|---|---|---|---|
| *ex.: histórico do lead* | *CRM* | *API, token do cliente* | *tempo real* | *segue sem histórico e sinaliza* |

**O que ele NÃO tem como saber** (e portanto não pode afirmar):
- 

---

## 3. Ferramentas — o que ele executa no mundo real

| Ferramenta | Leitura ou escrita | O que faz | Estrago se usar errado |
|---|---|---|---|
| | L / E | | |

Toda linha marcada **E** precisa de limite correspondente na seção 5.

---

## 4. Processos — como ele pensa e decide

**Ordem de raciocínio:**
1. 
2. 
3. 

**Critérios de decisão:**

| Situação | Critério | Ação |
|---|---|---|
| | | |

**Em caso de dúvida:** *o comportamento padrão — perguntar, escalar ou seguir pelo caminho
mais conservador. Escreva explicitamente; sem isso o sistema improvisa.*

---

## 5. Limites — o que ele pode e não pode

**Nunca faz:**
- 
- 

**Escala para humano quando:**

| Gatilho | Escala para quem | Por qual canal |
|---|---|---|
| | | |

**Tetos numéricos:**

| Limite | Valor |
|---|---|
| *ex.: desconto máximo* | |
| *ex.: mensagens por lead por dia* | |
| *ex.: tentativas antes de desistir* | |

**Dados sensíveis:** *o que ele acessa, para qual finalidade, por quanto tempo guarda.*

---

## 6. Entrega

**Artefatos:**
- 

**Credenciais que o cliente precisa provisionar:**

| Credencial | Onde obter | Responsável |
|---|---|---|

**Plano de teste:**

| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Caso feliz | | |
| Caso de borda | | |
| Falha de fonte | | |

**Riscos e o que quebra primeiro:**
- 

**Fora de escopo nesta versão:**
- 

---

**Aprovação:** ( ) aprovado como está  ( ) aprovado com os ajustes acima  ( ) refazer
