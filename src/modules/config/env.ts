export interface AppConfig {
  chainEndpoint: string
  gatewayEndpoint: string
  networkName: string
  appVersion: string
}

export const appConfig: AppConfig = {
  chainEndpoint: import.meta.env.VITE_CHAIN_ENDPOINT ?? 'ws://127.0.0.1:9944',
  gatewayEndpoint: import.meta.env.VITE_GATEWAY_ENDPOINT ?? 'http://127.0.0.1:8787',
  networkName: import.meta.env.VITE_NETWORK_NAME ?? 'Vibly Localnet',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.1.0-mvp',
}

