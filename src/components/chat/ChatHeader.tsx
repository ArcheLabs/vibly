import { ChevronDown, CircleDollarSign, PanelRightOpen } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import type { Conversation, Identity } from '@/types'

type ChatHeaderProps = {
  conversation: Conversation
  currentIdentity: Identity
  onOpenUserProfile: () => void
  onOpenAgentProfile?: () => void
  onToggleIdentitySwitcher: () => void
  onClearSelection: () => void
}

export function ChatHeader({
  conversation,
  currentIdentity,
  onOpenUserProfile,
  onOpenAgentProfile,
  onToggleIdentitySwitcher,
  onClearSelection,
}: ChatHeaderProps) {
  const isAgentConversation = conversation.targetType === 'agent'

  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 px-6 py-5">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar label={conversation.humanName} tone="human" onClick={onOpenUserProfile} />
        {isAgentConversation && conversation.agentName ? (
          <Avatar label={conversation.agentName} tone="agent" onClick={onOpenAgentProfile} />
        ) : null}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-2xl font-semibold text-ink">
              {conversation.targetType === 'human' ? conversation.humanName : conversation.agentName}
            </h2>
            {conversation.state === 'restricted' ? (
              <Badge label="收费中" variant="warning" />
            ) : null}
            {conversation.state === 'paused' ? <Badge label="已暂停" variant="muted" /> : null}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {conversation.targetType === 'human'
              ? '真人会话 · 可直接发送'
              : `${conversation.humanName} 的智能体 · ${conversation.state === 'paused' ? '暂不可用' : '可公开访问'}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {conversation.state === 'restricted' ? (
          <div className="hidden items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-700 md:flex">
            <CircleDollarSign className="h-4 w-4" />
            <span>继续交流前需确认费用</span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleIdentitySwitcher}
          className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:border-stone-300"
        >
          <span>当前以 {currentIdentity.name}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          className="rounded-full border border-stone-200 bg-white p-2.5 text-stone-500 shadow-sm transition hover:border-stone-300 hover:text-ink"
          aria-label="clear conversation"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
