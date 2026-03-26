import { Avatar } from './Avatar'

type CompositeAvatarProps = {
  humanLabel: string
  agentLabel?: string
  onHumanClick?: () => void
  onAgentClick?: () => void
}

export function CompositeAvatar({
  humanLabel,
  agentLabel,
  onHumanClick,
  onAgentClick,
}: CompositeAvatarProps) {
  return (
    <div className="relative h-12 w-12 shrink-0">
      <Avatar label={humanLabel} tone="human" onClick={onHumanClick} />
      {agentLabel ? (
        <div className="absolute -bottom-1 -right-1 rounded-2xl border-2 border-white">
          <Avatar
            label={agentLabel}
            size="sm"
            tone="agent"
            onClick={onAgentClick ?? onHumanClick}
          />
        </div>
      ) : null}
    </div>
  )
}
