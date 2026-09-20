/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL da API (ex.: http://localhost:3333/api/v1). Define o modo conectado. */
  readonly VITE_API_URL?: string
  /** 'hash' força rotas em hash no build de demonstração. */
  readonly VITE_ROUTER?: 'hash' | 'history'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
