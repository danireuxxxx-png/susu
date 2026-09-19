import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Build de demonstração: gera `dist-demo/index.html` como arquivo único, com
 * CSS e JS embutidos e rotas em hash. Serve para compartilhar o protótipo em
 * qualquer hospedagem estática, inclusive uma que não controle as rotas do
 * servidor. O build de produção (`npm run build`) continua sendo o normal.
 */
function inlineEverything(): Plugin {
  return {
    name: 'demo-single-file',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const page = Object.values(bundle).find(
        (file) => file.type === 'asset' && file.fileName === 'index.html',
      )
      if (!page || page.type !== 'asset') return

      let html = String(page.source)

      for (const [fileName, file] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && file.type === 'asset') {
          const css = String(file.source)
          html = html.replace(
            new RegExp(`<link[^>]+href="[^"]*${fileName}"[^>]*>`),
            () => `<style>${css}</style>`,
          )
          delete bundle[fileName]
        }

        if (fileName.endsWith('.js') && file.type === 'chunk') {
          const code = file.code
            // Sem code splitting não há lista de módulos para pré-carregar, e o
            // placeholder do Vite fica por resolver.
            .replace(/__VITE_PRELOAD__/g, 'void 0')
            // "</script>" dentro de uma string do bundle fecharia a tag cedo.
            .replace(/<\/script/gi, '<\\/script')
          html = html.replace(
            new RegExp(`<script[^>]+src="[^"]*${fileName}"[^>]*></script>`),
            () => `<script type="module">${code}</script>`,
          )
          delete bundle[fileName]
        }
      }

      page.source = html
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineEverything()],
  base: './',
  define: {
    'import.meta.env.VITE_ROUTER': JSON.stringify('hash'),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist-demo',
    cssCodeSplit: false,
    // Sem preload: o helper do Vite deixa um placeholder por resolver quando
    // não há code splitting.
    modulePreload: false,
    assetsInlineLimit: 100_000_000,
    // Sem code splitting: o protótipo precisa caber em um arquivo só.
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
