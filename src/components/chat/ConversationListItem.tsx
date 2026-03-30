import { SidebarItem } from '@/components/ui/SidebarItem'
import { Avatar } from '@/components/ui/Avatar'
import type { Conversation } from '@/types'

type ConversationListItemProps = {
  item: Conversation
  active: boolean
  onClick: () => void
}

export function ConversationListItem({ item, active, onClick }: ConversationListItemProps) {
  const title = item.agentName ?? item.humanName
  const subtitle = item.agentName ? item.humanName : item.subtitle

  return (
    <SidebarItem
      title={title}
      subtitle={subtitle}
      time={item.updatedAt}
      active={active}
      unreadCount={item.unreadCount}
      onClick={onClick}
      leading={
        <div className="relative h-10 w-10 shrink-0">
          <Avatar label={item.humanName} size="md" tone="human" />
          {item.agentName ? (
            <div className="absolute -bottom-1 -right-1">
              <Avatar label={item.agentName} size="sm" tone="agent" />
            </div>
          ) : null}
        </div>
      }
    />
  )
}
