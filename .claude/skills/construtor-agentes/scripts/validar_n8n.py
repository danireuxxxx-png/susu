#!/usr/bin/env python3
"""Valida um workflow do n8n antes da entrega.

Pega a classe de erro que só aparece na hora de importar ou de rodar na instância do
cliente: conexão apontando para nó inexistente, expressão citando nó que foi renomeado,
agente sem modelo de linguagem, ferramenta sem workflow, nó órfão, segredo esquecido
dentro do arquivo.

Uso:
    python3 validar_n8n.py workflow.json [outro.json ...]

Saída: ERRO impede a entrega (código 1). AVISO é decisão sua (código 0).

O que ele NÃO verifica: se os campos dentro de 'parameters' existem e estão certos para
aquela versão do nó. Isso só a instância do n8n sabe — veja references/n8n-parametros.md
para o jeito de obter o schema verdadeiro.
"""

import json
import re
import sys

# Sub-conexões de IA: a origem é o sub-nó e o destino é o nó agente/chain.
AI_CONN = {
    "ai_languageModel", "ai_memory", "ai_tool", "ai_outputParser",
    "ai_embedding", "ai_vectorStore", "ai_document", "ai_textSplitter",
    "ai_retriever",
}

# Nós que não executam sem um modelo de linguagem ligado.
PRECISA_MODELO = {
    "@n8n/n8n-nodes-langchain.agent",
    "@n8n/n8n-nodes-langchain.chainLlm",
    "@n8n/n8n-nodes-langchain.chainSummarization",
    "@n8n/n8n-nodes-langchain.informationExtractor",
    "@n8n/n8n-nodes-langchain.textClassifier",
}

PREFIXOS_CONHECIDOS = ("n8n-nodes-base.", "@n8n/n8n-nodes-langchain.")

# Formatos de segredo reconhecíveis por si só.
TOKENS = [
    (r"sk-ant-[A-Za-z0-9_\-]{16,}", "chave de API da Anthropic"),
    (r"sk-[A-Za-z0-9_\-]{20,}", "chave de API da OpenAI"),
    (r"ghp_[A-Za-z0-9]{20,}", "token do GitHub"),
    (r"xox[baprs]-[A-Za-z0-9\-]{10,}", "token do Slack"),
    (r"AIza[A-Za-z0-9_\-]{30,}", "chave de API do Google"),
    (r"[Bb]earer\s+[A-Za-z0-9._\-]{20,}", "token Bearer"),
    (r"eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.", "JWT"),
    (r"(?i)\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?)://[^:\s\"']+:[^@\s\"']{4,}@", "senha em string de conexão"),
]

# Nome de campo que denuncia segredo, tanto em chave JSON quanto em objeto JS
# dentro de expressão ({{ JSON.stringify({ token: "..." }) }}).
NOME_SECRETO = r"(?i)\b(password|passwd|senha|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|token|bearer|private[_-]?key)\b"
SEGREDO_EM_EXPRESSAO = re.compile(NOME_SECRETO + r"\s*:\s*[\"']([^\"']{8,})[\"']")
CHAVE_SECRETA = re.compile(NOME_SECRETO)

# Placeholder óbvio não é vazamento.
PLACEHOLDER = re.compile(
    r"(?i)^(=|\{\{|\s*$)|^(seu|sua|your|my|meu|xxx+|\.\.\.|<.*>|\[.*\]|change|replace|todo|"
    r"placeholder|exemplo|example|dummy|fake|test)[\w_\-]*$|^[*xX.\-_]{3,}$"
)

# Chamada de outro nó dentro de expressão: $('Nome') ou $("Nome").
REF_NO = re.compile(r"\$\(\s*(?:'([^']+)'|\"([^\"]+)\")\s*\)")


def andar(valor, caminho=""):
    """Percorre a estrutura já decodificada, devolvendo (caminho, chave, string)."""
    if isinstance(valor, dict):
        for k, v in valor.items():
            sub = f"{caminho}.{k}" if caminho else str(k)
            if isinstance(v, str):
                yield sub, str(k), v
            else:
                yield from andar(v, sub)
    elif isinstance(valor, list):
        for i, v in enumerate(valor):
            sub = f"{caminho}[{i}]"
            if isinstance(v, str):
                yield sub, None, v
            else:
                yield from andar(v, sub)


def portas_de(conexoes, nome):
    """As portas de um nó, só quando bem formadas — evita estourar em arquivo torto."""
    p = conexoes.get(nome)
    return p if isinstance(p, dict) else {}


def destinos(saidas):
    """Destinos de uma lista de saídas, ignorando o que estiver malformado."""
    if not isinstance(saidas, list):
        return
    for saida in saidas:
        if not isinstance(saida, list):
            continue
        for d in saida:
            if isinstance(d, dict) and isinstance(d.get("node"), str):
                yield d["node"]


def validar(caminho):
    erros, avisos = [], []

    try:
        bruto = open(caminho, encoding="utf-8").read()
    except OSError as e:
        return [f"não foi possível ler o arquivo: {e}"], []

    try:
        wf = json.loads(bruto)
    except json.JSONDecodeError as e:
        return [f"JSON inválido na linha {e.lineno}, coluna {e.colno}: {e.msg}"], []

    if not isinstance(wf, dict):
        return ["o arquivo precisa ser um objeto JSON com 'nodes' e 'connections'"], []

    nos = wf.get("nodes")
    if not isinstance(nos, list) or not nos:
        return ["'nodes' ausente ou vazio — o n8n não importa este arquivo"], []

    conexoes = wf.get("connections")
    if not isinstance(conexoes, dict):
        erros.append("'connections' ausente ou malformado — use {} se o workflow tiver um nó só")
        conexoes = {}

    # --- nós -------------------------------------------------------------
    nomes, ids, tipo_por_nome = {}, {}, {}
    for i, no in enumerate(nos):
        if not isinstance(no, dict):
            erros.append(f"nós[{i}]: deveria ser um objeto")
            continue

        nome, tipo = no.get("name"), no.get("type")
        rot = nome or f"nós[{i}]"

        if not nome:
            erros.append(f"{rot}: sem 'name' — é a chave usada em connections e nas expressões")
        elif nome in nomes:
            erros.append(f"nome de nó duplicado: {nome!r} — connections e $('{nome}') ficam ambíguos")
        else:
            nomes[nome] = no
            tipo_por_nome[nome] = tipo

        if not tipo:
            erros.append(f"{rot}: sem 'type'")
        elif not tipo.startswith(PREFIXOS_CONHECIDOS):
            avisos.append(
                f"{rot}: tipo {tipo!r} não usa prefixo conhecido — confirme que é nó de "
                "comunidade instalado na instância do cliente"
            )

        if "typeVersion" not in no:
            avisos.append(f"{rot}: sem 'typeVersion' — o n8n pode recusar na importação")

        nid = no.get("id")
        if not nid:
            avisos.append(f"{rot}: sem 'id' — gere um UUID v4")
        elif nid in ids:
            erros.append(f"{rot}: 'id' duplicado com o nó {ids[nid]!r}")
        else:
            ids[nid] = rot

        pos = no.get("position")
        if not (isinstance(pos, list) and len(pos) == 2):
            avisos.append(f"{rot}: 'position' deve ser [x, y] — sem isso o canvas embola")

        cred = no.get("credentials")
        if isinstance(cred, dict):
            for ref in cred.values():
                if isinstance(ref, dict) and ref.get("id"):
                    avisos.append(
                        f"{rot}: credencial com 'id' local ({ref.get('name') or ref['id']!r}) — "
                        "remova o id antes de entregar, ele não existe na instância do cliente"
                    )

    # --- conexões --------------------------------------------------------
    recebe_main, recebe_ai, e_subno = set(), {}, set()
    for origem, portas in conexoes.items():
        if origem not in nomes:
            erros.append(f"connections: origem {origem!r} não existe entre os nós")
        if not isinstance(portas, dict):
            erros.append(f"connections[{origem!r}]: deveria ser um objeto por tipo de conexão")
            continue
        for tipo_conn, saidas in portas.items():
            if not isinstance(saidas, list):
                erros.append(f"connections[{origem!r}][{tipo_conn!r}]: deveria ser uma lista de saídas")
                continue
            if not any(isinstance(s, list) for s in saidas) and saidas:
                erros.append(
                    f"connections[{origem!r}][{tipo_conn!r}]: cada saída é uma lista de "
                    "destinos (array de array)"
                )
                continue
            if tipo_conn in AI_CONN:
                e_subno.add(origem)
            for alvo in destinos(saidas):
                if alvo not in nomes:
                    erros.append(
                        f"connections[{origem!r}] aponta para {alvo!r}, que não existe — "
                        "o n8n ignora essa ligação em silêncio"
                    )
                elif tipo_conn == "main":
                    recebe_main.add(alvo)
                elif tipo_conn in AI_CONN:
                    recebe_ai.setdefault(alvo, set()).add(tipo_conn)

    # --- nós de IA incompletos -------------------------------------------
    for nome, tipo in tipo_por_nome.items():
        if tipo in PRECISA_MODELO and "ai_languageModel" not in recebe_ai.get(nome, set()):
            erros.append(
                f"{nome!r} ({tipo.split('.')[-1]}): sem conexão 'ai_languageModel' — "
                "importa, mas falha na execução"
            )

    # --- órfãos ----------------------------------------------------------
    for nome, no in nomes.items():
        tipo = (no.get("type") or "").lower()
        if "trigger" in tipo or tipo.endswith(".webhook") or nome in e_subno:
            continue
        if nome not in recebe_main:
            avisos.append(f"{nome!r}: nenhuma entrada 'main' e não é gatilho — nó órfão, nunca executa")

    if len(nomes) > 1 and not any(
        "trigger" in (no.get("type") or "").lower() or (no.get("type") or "").endswith(".webhook")
        for no in nomes.values()
    ):
        avisos.append("nenhum gatilho no workflow — só roda manualmente ou chamado por outro")

    # --- ferramentas -----------------------------------------------------
    for nome, no in nomes.items():
        tipo = no.get("type") or ""
        if ".tool" not in tipo.lower():
            continue
        p = no.get("parameters") if isinstance(no.get("parameters"), dict) else {}
        desc = (p.get("toolDescription") or p.get("description") or "").strip()
        if not desc:
            avisos.append(
                f"{nome!r}: ferramenta sem descrição — o agente escolhe a ferramenta lendo "
                "esse texto; sem ele, chama a errada"
            )
        elif len(desc) < 25:
            avisos.append(f"{nome!r}: descrição da ferramenta curta demais para orientar a escolha")

        if tipo.endswith(".toolWorkflow"):
            wid = p.get("workflowId")
            vazio = not wid or (isinstance(wid, dict) and not wid.get("value"))
            if vazio:
                erros.append(
                    f"{nome!r}: 'workflowId' vazio — o agente não consegue chamar esta ferramenta. "
                    "Preencha ou documente como passo obrigatório pós-importação"
                )

    # --- LLM alimentando decisão sem parser ------------------------------
    for origem in conexoes:
        if tipo_por_nome.get(origem) != "@n8n/n8n-nodes-langchain.chainLlm":
            continue
        if "ai_outputParser" in recebe_ai.get(origem, set()):
            continue
        alvos = set(destinos(portas_de(conexoes, origem).get("main")))
        if any(tipo_por_nome.get(a) in ("n8n-nodes-base.if", "n8n-nodes-base.switch") for a in alvos):
            avisos.append(
                f"{origem!r}: alimenta um IF/Switch sem Structured Output Parser — "
                "a saída em texto livre faz a comparação falhar de forma intermitente"
            )

    # --- expressões citando nós ------------------------------------------
    # Renomear um nó e atualizar só 'connections' deixa as expressões apontando
    # para o vazio: importa limpo e quebra em execução.
    for caminho, _chave, texto in andar(wf.get("nodes")):
        for m in REF_NO.finditer(texto):
            alvo = m.group(1) or m.group(2)
            if alvo not in nomes:
                erros.append(
                    f"expressão em nós{caminho} usa $('{alvo}'), e não existe nó com esse nome — "
                    "provável rename sem atualizar as expressões"
                )

    # --- execução e segredos ---------------------------------------------
    if (wf.get("settings") or {}).get("executionOrder") != "v1":
        avisos.append("settings.executionOrder != 'v1' — a ordem entre ramos fica imprevisível")

    vistos = set()
    for caminho, chave, texto in andar(wf):
        for padrao, rotulo in TOKENS:
            if re.search(padrao, texto) and rotulo not in vistos:
                vistos.add(rotulo)
                erros.append(f"SEGREDO em {caminho}: {rotulo} — use credencial ou variável de ambiente")

        # Campo cujo nome denuncia segredo, com valor literal.
        if chave and CHAVE_SECRETA.search(chave) and len(texto) >= 8 and not PLACEHOLDER.match(texto):
            erros.append(f"SEGREDO em {caminho}: campo {chave!r} com valor literal — use credencial")

        # Objeto JS dentro de expressão: {{ JSON.stringify({ token: "..." }) }}
        for m in SEGREDO_EM_EXPRESSAO.finditer(texto):
            if not PLACEHOLDER.match(m.group(2)):
                erros.append(
                    f"SEGREDO em {caminho}: {m.group(1)!r} com valor literal dentro de expressão — "
                    "use $credentials ou $env"
                )

    return erros, avisos


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2

    falhou = False
    for caminho in argv[1:]:
        try:
            erros, avisos = validar(caminho)
        except Exception as e:  # o validador nunca deve morrer em cima de arquivo torto
            erros, avisos = [f"arquivo malformado, o validador não conseguiu analisar: {e!r}"], []

        print(f"\n=== {caminho} ===")
        for e in erros:
            print(f"  ERRO   {e}")
        for a in avisos:
            print(f"  AVISO  {a}")
        if not erros and not avisos:
            print("  OK — estrutura válida. Os campos de 'parameters' não são verificados aqui.")
        elif not erros:
            print(f"  Importável. {len(avisos)} aviso(s) para revisar.")
        else:
            print(f"  NÃO ENTREGAR: {len(erros)} erro(s).")
            falhou = True

    return 1 if falhou else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
