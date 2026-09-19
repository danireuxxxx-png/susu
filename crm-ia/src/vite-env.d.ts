/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL da API quando o backend existir. */
  readonly VITE_API_URL?: string
  /** 'hash' força rotas em hash no build de demonstração. */
  readonly VITE_ROUTER?: 'hash' | 'history'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
