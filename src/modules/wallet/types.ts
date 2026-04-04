export interface WalletAccount {
  id: string
  source: 'extension' | 'seed' | 'json' | 'qr' | 'test'
  name?: string
  address: string
  publicKeyHex: string
  isTestWallet: boolean
  isReadOnly: boolean
  balance: number
  gasBalance: number
  backedUp: boolean
  network: string
}

export type WalletStatus =
  | 'idle'
  | 'detecting'
  | 'wallets_available'
  | 'wallet_connected'
  | 'account_selected'
  | 'network_mismatch'
  | 'insufficient_gas'
  | 'error'

export interface WalletState {
  accounts: WalletAccount[]
  activeAccountId: string | null
  status: WalletStatus
}

