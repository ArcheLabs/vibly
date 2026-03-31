import { ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/IconButton'
import { useI18n } from '@/i18n'
import { getConversationStateLabel } from '@/i18n/labels'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types'

type HeaderTarget = 'human' | 'agent'

type ChatHeaderProps = {
  conversation: Conversation
  targetView: HeaderTarget
  targetMenuOpen: boolean
  onTargetMenuOpenChange: (open: boolean) => void
  onTargetViewChange: (target: HeaderTarget) => void
  onOpenTargetProfile: () => void
}

export function ChatHeader({
  conversation,
  targetView,
  targetMenuOpen,
  onTargetMenuOpenChange,
  onTargetViewChange,
  onOpenTargetProfile,
}: ChatHeaderProps) {
  const { t } = useI18n()
  const isViewingAgent = targetView === 'agent'
  const title = isViewingAgent ? conversation.agentName : conversation.humanName
  const description = isViewingAgent
    ? t('chat.agentFrom', { name: conversation.humanName })
    : t('chat.directConversation')
  const hasAgentTarget = conversation.targetType === 'agent' && Boolean(conversation.agentName)

  return (
    <div className="relative flex items-center justify-between gap-3 px-3 py-3 lg:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          label={title ?? conversation.humanName}
          tone={isViewingAgent ? 'agent' : 'human'}
          onClick={onOpenTargetProfile}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold text-primary">{title}</h2>
            {conversation.state === 'restricted' ? (
              <Badge label={getConversationStateLabel('restricted', t)} variant="warning" />
            ) : null}
            {conversation.state === 'paused' ? (
              <Badge label={getConversationStateLabel('paused', t)} variant="muted" />
            ) : null}
          </div>
          <p className="truncate text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="relative">
        <IconButton onClick={() => onTargetMenuOpenChange(!targetMenuOpen)} aria-label={t('actions.switchTarget')}>
          <ChevronDown className="h-4 w-4" />
        </IconButton>
        {targetMenuOpen ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[164px] rounded-2xl border border-default bg-surface p-1.5">
            <button
              type="button"
              onClick={() => onTargetViewChange('human')}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
                targetView === 'human' ? 'bg-muted text-primary' : 'text-secondary hover-bg-muted',
              )}
            >
              <Avatar label={conversation.humanName} size="sm" tone="human" />
              <span className="truncate">{conversation.humanName}</span>
            </button>
            {hasAgentTarget ? (
              <button
                type="button"
                onClick={() => onTargetViewChange('agent')}
                className={cn(
                  'mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
                  targetView === 'agent' ? 'bg-muted text-primary' : 'text-secondary hover-bg-muted',
                )}
              >
                <Avatar label={conversation.agentName ?? t('chat.targetAgentFallback')} size="sm" tone="agent" />
                <span className="truncate">{conversation.agentName}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
