# Especificação — [Nome do agente/automação]

> Preencha e envie para aprovação **antes** de construir.
>
> Suposição é permitida — **desde que marcada como tal**. Preencha o que der para deduzir do
> contexto, do catálogo e do repositório, e leve para a seção 0 tudo que você deduziu e não
> confirmou. O que não se resolve nem por dedução vira pergunta aberta ali. O que nunca vale
> é suposição não declarada no meio do texto: ela some dentro do documento e vira, sem
> ninguém notar, requisito aprovado.

| | |
|---|---|
| **Cliente** | |
| **Tipo** | ( ) Automação  ( ) Automação com nó de IA  ( ) Agente |
| **Plataforma** | ( ) n8n  ( ) Hermes  ( ) n8n + Hermes |
| **Departamento** | |
| **Dono do processo** | *quem aprova e quem recebe o resultado* |
| **Ficha do catálogo** | *id em agent-catalog.ts, ou "novo"* |

---

## 0. Suposições e perguntas em aberto

Suposições que assumi para poder avançar — **confirme ou corrija**:

| # | Assumi que | Se estiver errado, muda o quê |
|---|---|---|
| 1 | | |

Perguntas que não consigo deduzir e preciso que você responda:

| # | Pergunta | Por que importa |
|---|---|---|
| 1 | | |

A pergunta que quase sempre aparece aqui é a 5 do diagnóstico — *quais decisões ele toma
sozinho* —, porque autonomia é decisão de negócio, não técnica: só o dono do processo pode
dizer até onde a máquina vai sem humano.

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
