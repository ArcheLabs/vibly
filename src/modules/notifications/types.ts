export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'identity' | 'profile' | 'agent' | 'wallet' | 'system'
  title: string
  message?: string
  createdAt: number
  read: boolean
}

export interface GlobalBanner {
  id: string
  tone: 'info' | 'warning' | 'error'
  title: string
  message: string
}

