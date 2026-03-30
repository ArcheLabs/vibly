import { ConversationListItem } from './ConversationListItem'
import type { Conversation } from '@/types'

type ConversationListProps = {
  items: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ items, activeId, onSelect }: ConversationListProps) {
  return (
    <div>
      {items.map((item) => (
        <ConversationListItem
          key={item.id}
          item={item}
          active={item.id === activeId}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  )
}
