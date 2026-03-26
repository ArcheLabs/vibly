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
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { key: 'chat', label: '聊天', icon: MessageCircle },
  { key: 'agents', label: '智能体', icon: Bot },
  { key: 'discover', label: '发现', icon: Compass },
  { key: 'contacts', label: '联系人', icon: Users },
  { key: 'wallet', label: '钱包', icon: Wallet },
  { key: 'me', label: '我的', icon: UserRound },
]
