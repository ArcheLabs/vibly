/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAIN_ENDPOINT?: string
  readonly VITE_GATEWAY_ENDPOINT?: string
  readonly VITE_NETWORK_NAME?: string
  readonly VITE_APP_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
