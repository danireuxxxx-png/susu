#!/usr/bin/env python3
"""Valida um workflow do n8n antes da entrega.

Pega a classe de erro que só aparece na hora de importar na instância do cliente:
conexão apontando para nó inexistente, agente sem modelo de linguagem, nó órfão,
segredo esquecido dentro do arquivo.

Uso:
    python3 validar_n8n.py workflow.json [outro.json ...]

Saída: ERRO impede a entrega (código 1). AVISO é decisão sua (código 0).
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

# Segredo esquecido no arquivo. O alvo é o valor literal, não o nome do campo.
SEGREDOS = [
    (r"sk-[A-Za-z0-9_\-]{16,}", "chave de API da OpenAI"),
    (r"sk-ant-[A-Za-z0-9_\-]{16,}", "chave de API da Anthropic"),
    (r"ghp_[A-Za-z0-9]{20,}", "token do GitHub"),
    (r"xox[baprs]-[A-Za-z0-9\-]{10,}", "token do Slack"),
    (r"AIza[A-Za-z0-9_\-]{30,}", "chave de API do Google"),
    (r"[Bb]earer\s+[A-Za-z0-9._\-]{20,}", "token Bearer"),
    (r"eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.", "JWT"),
    (r"(?i)\"(password|senha|secret|token|apikey|api_key)\"\s*:\s*\"(?!=|\{\{|\s*\")[^\"]{8,}\"",
     "campo de segredo com valor literal"),
]


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
        erros.append("'connections' ausente — use {} se o workflow tiver um nó só")
        conexoes = {}

    # --- nós -------------------------------------------------------------
    nomes, ids = {}, {}
    tipo_por_nome = {}
    for i, no in enumerate(nos):
        nome = no.get("name")
        tipo = no.get("type")
        rot = nome or f"nós[{i}]"

        if not nome:
            erros.append(f"{rot}: sem 'name' — é a chave usada em connections")
        elif nome in nomes:
            erros.append(f"nome de nó duplicado: {nome!r} — connections fica ambíguo")
        else:
            nomes[nome] = no
            tipo_por_nome[nome] = tipo

        if not tipo:
            erros.append(f"{rot}: sem 'type'")
        elif not tipo.startswith(PREFIXOS_CONHECIDOS):
            avisos.append(
                f"{rot}: tipo {tipo!r} não usa prefixo conhecido — "
                "confirme que é nó de comunidade instalado na instância do cliente"
            )

        if "typeVersion" not in no:
            avisos.append(f"{rot}: sem 'typeVersion' — o n8n pode recusar na importação")

        nid = no.get("id")
        if not nid:
            avisos.append(f"{rot}: sem 'id' — gere um UUID v4")
        elif nid in ids:
            erros.append(f"{rot}: 'id' duplicado com o nó {ids[nid]!r}")
        else:
            ids[nid] = nome or rot

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
    recebe_main, recebe_ai = set(), {}
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
            for saida in saidas:
                if not isinstance(saida, list):
                    erros.append(
                        f"connections[{origem!r}][{tipo_conn!r}]: cada saída é uma lista "
                        "de destinos (array de array)"
                    )
                    continue
                for dest in saida:
                    if not isinstance(dest, dict) or "node" not in dest:
                        erros.append(f"connections[{origem!r}]: destino sem 'node'")
                        continue
                    alvo = dest["node"]
                    if alvo not in nomes:
                        erros.append(
                            f"connections[{origem!r}] aponta para {alvo!r}, que não existe — "
                            "o n8n ignora essa ligação em silêncio"
                        )
                        continue
                    if tipo_conn == "main":
                        recebe_main.add(alvo)
                    elif tipo_conn in AI_CONN:
                        recebe_ai.setdefault(alvo, set()).add(tipo_conn)

    # --- agentes sem modelo ---------------------------------------------
    for nome, tipo in tipo_por_nome.items():
        if tipo in PRECISA_MODELO and "ai_languageModel" not in recebe_ai.get(nome, set()):
            erros.append(
                f"{nome!r} ({tipo.split('.')[-1]}): sem conexão 'ai_languageModel' — "
                "importa, mas falha na execução"
            )

    # --- órfãos ----------------------------------------------------------
    for nome, no in nomes.items():
        tipo = (no.get("type") or "").lower()
        e_gatilho = "trigger" in tipo or tipo.endswith(".webhook")
        e_subno = nome in {
            d["node"]
            for portas in conexoes.values() if isinstance(portas, dict)
            for tc, saidas in portas.items() if tc in AI_CONN and isinstance(saidas, list)
            for saida in saidas if isinstance(saida, list)
            for d in saida if isinstance(d, dict) and "node" in d
        } or nome in conexoes and any(
            tc in AI_CONN for tc in conexoes[nome]
        )
        if not e_gatilho and not e_subno and nome not in recebe_main:
            avisos.append(f"{nome!r}: nenhuma entrada 'main' e não é gatilho — nó órfão, nunca executa")

    if len(nomes) > 1:
        gatilhos = [n for n, no in nomes.items()
                    if "trigger" in (no.get("type") or "").lower()
                    or (no.get("type") or "").endswith(".webhook")]
        if not gatilhos:
            avisos.append("nenhum gatilho no workflow — só roda manualmente ou chamado por outro")

    # --- descrição de ferramenta ----------------------------------------
    for nome, no in nomes.items():
        tipo = no.get("type") or ""
        if ".tool" in tipo.lower():
            p = no.get("parameters") or {}
            desc = p.get("toolDescription") or p.get("description") or ""
            if not desc.strip():
                avisos.append(
                    f"{nome!r}: ferramenta sem descrição — o agente escolhe a ferramenta lendo "
                    "esse texto; sem ele, chama a errada"
                )
            elif len(desc.strip()) < 25:
                avisos.append(f"{nome!r}: descrição da ferramenta curta demais para orientar a escolha")

    # --- LLM alimentando decisão sem parser ------------------------------
    for origem, portas in conexoes.items():
        if tipo_por_nome.get(origem) != "@n8n/n8n-nodes-langchain.chainLlm":
            continue
        if "ai_outputParser" in recebe_ai.get(origem, set()):
            continue
        alvos = {d["node"]
                 for saida in portas.get("main", []) if isinstance(saida, list)
                 for d in saida if isinstance(d, dict) and "node" in d}
        if any(tipo_por_nome.get(a) in ("n8n-nodes-base.if", "n8n-nodes-base.switch") for a in alvos):
            avisos.append(
                f"{origem!r}: alimenta um IF/Switch sem Structured Output Parser — "
                "a saída em texto livre faz a comparação falhar de forma intermitente"
            )

    # --- execução e segredos --------------------------------------------
    if (wf.get("settings") or {}).get("executionOrder") != "v1":
        avisos.append("settings.executionOrder != 'v1' — a ordem entre ramos fica imprevisível")

    for padrao, rotulo in SEGREDOS:
        if re.search(padrao, bruto):
            erros.append(f"SEGREDO no arquivo: {rotulo} — troque por credencial ou variável de ambiente")

    return erros, avisos


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2

    falhou = False
    for caminho in argv[1:]:
        erros, avisos = validar(caminho)
        print(f"\n=== {caminho} ===")
        for e in erros:
            print(f"  ERRO   {e}")
        for a in avisos:
            print(f"  AVISO  {a}")
        if not erros and not avisos:
            print("  OK — nenhum problema encontrado.")
        elif not erros:
            print(f"  Importável. {len(avisos)} aviso(s) para revisar.")
        else:
            print(f"  NÃO ENTREGAR: {len(erros)} erro(s).")
            falhou = True

    return 1 if falhou else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
