import { Circle, Lock } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
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
        'flex w-full items-start gap-3 border-b border-default bg-surface px-3 py-3 text-left transition',
        active ? 'bg-muted' : 'hover-bg-muted',
      )}
    >
      <div className="relative">
        <Avatar label={agent.name} tone="agent" />
        {agent.visibility === 'private' ? (
          <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-default bg-surface text-secondary">
            <Lock className="h-3 w-3" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-primary">{agent.name}</p>
            <p className="mt-1 truncate text-xs text-muted">{agent.bio}</p>
          </div>
          {agent.status === 'active' ? <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" /> : null}
        </div>
      </div>
    </button>
  )
}
