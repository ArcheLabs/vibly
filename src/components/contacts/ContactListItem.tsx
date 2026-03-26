import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
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
        'flex w-full items-start gap-3 rounded-[24px] border p-3 text-left transition',
        active ? 'border-coral bg-coral text-white' : 'border-transparent bg-white/80 hover:bg-white',
      )}
    >
      <Avatar label={contact.name} tone={contact.kind === 'agent' ? 'agent' : 'human'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{contact.name}</p>
            <p className={cn('mt-1 truncate text-xs', active ? 'text-white/70' : 'text-stone-500')}>
              {contact.kind === 'request' ? contact.requestNote : contact.bio}
            </p>
          </div>
          <Badge
            label={contact.kind === 'request' ? contact.status ?? 'pending' : contact.kind}
            variant={contact.kind === 'agent' ? 'agent' : contact.kind === 'human' ? 'human' : 'warning'}
          />
        </div>
      </div>
    </button>
  )
}
