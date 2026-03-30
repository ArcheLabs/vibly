import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types'

type ContactListItemProps = {
  contact: Contact
  active: boolean
  onClick: () => void
}

export function ContactListItem({ contact, active, onClick }: ContactListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-default bg-surface px-3 py-3 text-left transition',
        active ? 'bg-muted' : 'hover-bg-muted',
      )}
    >
      <Avatar label={contact.name} tone={contact.kind === 'agent' ? 'agent' : 'human'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-primary">{contact.name}</p>
            <p className="mt-1 truncate text-xs text-muted">{contact.kind === 'request' ? contact.requestNote : contact.bio}</p>
          </div>
        </div>
      </div>
    </button>
  )
}
