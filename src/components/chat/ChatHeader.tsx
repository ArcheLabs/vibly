import { PanelLeftOpen, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { IconButton } from '@/components/ui/IconButton'
import type { Conversation } from '@/types'

type HeaderTarget = 'human' | 'agent'

type ChatHeaderProps = {
  conversation: Conversation
  targetView: HeaderTarget
  targetMenuOpen: boolean
  onTargetMenuOpenChange: (open: boolean) => void
  onTargetViewChange: (target: HeaderTarget) => void
  onOpenTargetProfile: () => void
  onToggleList: () => void
  onClearSelection: () => void
}

export function ChatHeader({
  conversation,
  targetView,
  targetMenuOpen,
  onTargetMenuOpenChange,
  onTargetViewChange,
  onOpenTargetProfile,
  onToggleList,
  onClearSelection,
}: ChatHeaderProps) {
  const isViewingAgent = targetView === 'agent'
  const title = isViewingAgent ? conversation.agentName : conversation.humanName
  const description = isViewingAgent ? `来自 ${conversation.humanName} 的智能体` : '单聊会话'
  const hasAgentTarget = conversation.targetType === 'agent' && Boolean(conversation.agentName)

  return (
    <div className="flex items-center justify-between gap-3 border-b border-default px-3 py-3 lg:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton className="lg:hidden" onClick={onToggleList} aria-label="打开会话列表">
          <PanelLeftOpen className="h-4 w-4" />
        </IconButton>
        <Avatar
          label={title ?? conversation.humanName}
          tone={isViewingAgent ? 'agent' : 'human'}
          onClick={onOpenTargetProfile}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold text-primary">{title}</h2>
            {conversation.state === 'restricted' ? <Badge label="受限" variant="warning" /> : null}
            {conversation.state === 'paused' ? <Badge label="暂停" variant="muted" /> : null}
          </div>
          <p className="truncate text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Dropdown
          label={isViewingAgent ? '对方对象: 智能体' : '对方对象: 联系人'}
          open={targetMenuOpen}
          onOpenChange={onTargetMenuOpenChange}
          options={[
            {
              key: 'human',
              label: `联系人: ${conversation.humanName}`,
              active: targetView === 'human',
              onSelect: () => onTargetViewChange('human'),
            },
            ...(hasAgentTarget
              ? [
                  {
                    key: 'agent',
                    label: `智能体: ${conversation.agentName}`,
                    active: targetView === 'agent',
                    onSelect: () => onTargetViewChange('agent'),
                  },
                ]
              : []),
          ]}
        />
        <IconButton onClick={onClearSelection} aria-label="清空选中会话">
          <X className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  )
}
