import { makeId } from '@/lib/utils'
import type { GlobalBanner, AppNotification } from '@/modules/notifications/types'
import type { AgentRecord } from '@/modules/agents/types'
import type { WalletAccount } from '@/modules/wallet/types'

export function createNotification(
  input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>,
): AppNotification {
  return {
    id: makeId('notification'),
    createdAt: Date.now(),
    read: false,
    ...input,
  }
}

export function pushNotification(
  notifications: AppNotification[],
  notification: AppNotification,
): AppNotification[] {
  return [notification, ...notifications].slice(0, 40)
}

export function markNotificationRead(
  notifications: AppNotification[],
  notificationId: string,
): AppNotification[] {
  return notifications.map((item) =>
    item.id === notificationId ? { ...item, read: true } : item,
  )
}

export function markAllNotificationsRead(notifications: AppNotification[]) {
  return notifications.map((item) => ({ ...item, read: true }))
}

export function removeNotification(
  notifications: AppNotification[],
  notificationId: string,
) {
  return notifications.filter((item) => item.id !== notificationId)
}

interface BannerInput {
  activeAccount: WalletAccount | null
  identityRegistered: boolean
  unsupportedNetwork: boolean
  insufficientGas: boolean
  pendingProfilePublish: boolean
  localAgents: AgentRecord[]
}

export function deriveGlobalBanners({
  activeAccount,
  identityRegistered,
  unsupportedNetwork,
  insufficientGas,
  pendingProfilePublish,
  localAgents,
}: BannerInput): GlobalBanner[] {
  const banners: GlobalBanner[] = []
  const hasPendingAgentPublish = localAgents.some((agent) =>
    ['public_draft', 'public_dirty', 'publishing'].includes(agent.publishState),
  )

  if (activeAccount?.isTestWallet) {
    banners.push({
      id: 'test-wallet',
      tone: 'warning',
      title: 'Using test wallet',
      message: 'This signer is for localnet and demo flows only.',
    })
  }

  if (unsupportedNetwork) {
    banners.push({
      id: 'unsupported-network',
      tone: 'error',
      title: 'Unsupported network',
      message: 'Switch back to the localnet endpoint before sending publish actions.',
    })
  }

  if (activeAccount && !identityRegistered) {
    banners.push({
      id: 'identity-not-registered',
      tone: 'info',
      title: 'Identity not registered',
      message: 'Connect a signer and run the Root Identity registration flow from Me.',
    })
  }

  if (insufficientGas) {
    banners.push({
      id: 'insufficient-gas',
      tone: 'warning',
      title: 'Low gas balance',
      message: 'Top up the signer before trying on-chain registration or publish actions.',
    })
  }

  if (pendingProfilePublish || hasPendingAgentPublish) {
    banners.push({
      id: 'pending-publish',
      tone: 'info',
      title: 'Pending publish changes',
      message: 'Your local profile or agents have unpublished changes.',
    })
  }

  return banners
}
