import { Circle, Globe, Lock, PenSquare, Upload, FileClock } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { AgentRecord } from '@/modules/agents/types'
import type { Agent } from '@/types'

type AgentLike = Agent | AgentRecord

type AgentListItemProps = {
  agent: AgentLike
  active: boolean
  onClick: () => void
}

function getPublishAccessory(agent: AgentLike) {
  if ('publishState' in agent) {
    if (agent.publishState === 'private_local') {
      return <Lock className="h-3 w-3" />
    }
    if (agent.publishState === 'public_draft') {
      return <FileClock className="h-3 w-3" />
    }
    if (agent.publishState === 'publishing') {
      return <Upload className="h-3 w-3" />
    }
    if (agent.publishState === 'public_live') {
      return <Globe className="h-3 w-3" />
    }
    return <PenSquare className="h-3 w-3" />
  }

  if (agent.visibility === 'private') {
    return <Lock className="h-3 w-3" />
  }

  return null
}

export function AgentListItem({ agent, active, onClick }: AgentListItemProps) {
  const accessory = getPublishAccessory(agent)
  const bio = 'bio' in agent ? agent.bio : ''
  const avatarSrc = 'avatar' in agent ? agent.avatar : ('avatarRef' in agent ? agent.avatarRef ?? undefined : undefined)

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
        <Avatar label={agent.name} src={avatarSrc} tone="agent" />
        {accessory ? (
          <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-default bg-surface text-secondary">
            {accessory}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-primary">{agent.name}</p>
            <p className="mt-1 truncate text-xs text-muted">{bio}</p>
          </div>
          {agent.status === 'active' ? <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" /> : null}
        </div>
      </div>
    </button>
  )
}
