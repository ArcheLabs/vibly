import {
  Bot,
  Compass,
  MessageCircle,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppPage } from '@/types'

export type NavItem = {
  key: AppPage
  labelKey: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { key: 'chat', labelKey: 'nav.chat', icon: MessageCircle },
  { key: 'agents', labelKey: 'nav.agents', icon: Bot },
  { key: 'discover', labelKey: 'nav.discover', icon: Compass },
  { key: 'contacts', labelKey: 'nav.contacts', icon: Users },
  { key: 'wallet', labelKey: 'nav.wallet', icon: Wallet },
  { key: 'me', labelKey: 'nav.me', icon: UserRound },
]
