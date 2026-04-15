import { SidebarItem } from '@/components/ui/SidebarItem'
import { Avatar } from '@/components/ui/Avatar'
import { useI18n } from '@/i18n'
import { localizeRelativeTimeToken } from '@/i18n/format'
import type { Conversation } from '@/types'

type ConversationListItemProps = {
  item: Conversation
  active: boolean
  onClick: () => void
}

export function ConversationListItem({ item, active, onClick }: ConversationListItemProps) {
  const { locale } = useI18n()
  const title = item.agentName ?? item.humanName
  const subtitle = item.agentName ? item.humanName : item.subtitle
  const showAgentAvatar = Boolean(item.agentName)

  return (
    <SidebarItem
      title={title}
      subtitle={subtitle}
      time={localizeRelativeTimeToken(item.updatedAt, locale)}
      active={active}
      unreadCount={item.unreadCount}
      onClick={onClick}
      leading={
        <div className="relative h-10 w-10 shrink-0">
          <Avatar
            label={showAgentAvatar ? item.agentName ?? item.humanName : item.humanName}
            src={showAgentAvatar ? item.agentAvatar : item.humanAvatar}
            size="md"
            tone={showAgentAvatar ? 'agent' : 'human'}
          />
          {showAgentAvatar ? (
            <div className="absolute bottom-0 right-0 shadow-sm">
              <Avatar label={item.humanName} src={item.humanAvatar} size="xs" tone="human" />
            </div>
          ) : null}
        </div>
      }
    />
  )
}
