/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Used in vite.config only — proxy target for /api in dev */
  readonly VITE_DEV_API_PROXY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
