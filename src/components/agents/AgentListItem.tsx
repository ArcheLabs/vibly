import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { cn } from '@/lib/utils'
import type { Agent } from '@/types'

type AgentListItemProps = {
  agent: Agent
  active: boolean
  onClick: () => void
}

export function AgentListItem({ agent, active, onClick }: AgentListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-[24px] border p-3 text-left transition',
        active ? 'border-pine bg-pine text-white' : 'border-transparent bg-white/80 hover:bg-white',
      )}
    >
      <Avatar label={agent.name} tone="agent" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{agent.name}</p>
            <p className={cn('mt-1 truncate text-xs', active ? 'text-white/70' : 'text-stone-500')}>
              {agent.bio}
            </p>
          </div>
          <Badge label={agent.status} variant={agent.status === 'active' ? 'success' : 'muted'} />
        </div>
      </div>
    </button>
  )
}
