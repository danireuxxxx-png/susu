# Casa Ipê — site cinematográfico

Landing page do buffet Casa Ipê (Brasília) em versão cinematográfica e fotorrealista.
Toda a imagem e o vídeo da página são gerados pela Higgsfield via MCP.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `src/index.html` | Template da página. Os pontos de mídia são marcados com `data-asset="id"` (img/video) e `data-bg="id"` (fundos de seção). |
| `assets/manifest.json` | Lista de cada slot com modelo, proporção e prompt cinematográfico. Recebe `url` (resultado Higgsfield) ou `file` (arquivo local). |
| `build.py` | Baixa/comprime as mídias, gera `index.html` (caminhos relativos) e `dist/casa-ipe.html` (tudo embutido em data URI, para o artifact do Claude). |
| `assets/*.jpg`, `assets/*.mp4` | Saída otimizada do build. |

## Modelos usados

- **Imagens**: `nano_banana_pro` (Google Nano Banana Pro) a 2K — o modelo de maior qualidade fotorrealista do catálogo Higgsfield.
- **Vídeo do hero**: `kling3_0` (Kling 3.0) em modo `pro`, image-to-video a partir do still do hero, 5 s, sem áudio.

## Fluxo de geração

1. Garanta créditos no workspace Higgsfield (o plano free tem 0 créditos; há trial de 3 dias via MCP com 100 créditos).
2. Envie os 15 stills com `generate_image_batch` usando os prompts de `manifest.json` (prefixe cada prompt com o campo `look`). Custo: 2 créditos por imagem a 2K.
3. Com o `job_id` do hero, gere o vídeo com `generate_video` (`kling3_0`, `start_image` = hero, `mode: pro`, `sound: off`, 5 s). Custo: 7,5 créditos.
4. Preencha o campo `url` de cada slot no manifest e rode:

```bash
cd casa-ipe && python3 build.py
```

5. Publique `dist/casa-ipe.html` no artifact (mesma URL) e sirva a pasta para hospedagem normal.

Requisitos do build: Python 3 com `pillow` e `requests`.
