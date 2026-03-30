import { Heart, MessageSquareText } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { IconButton } from '@/components/ui/IconButton'
import type { Agent } from '@/types'

type AgentCardProps = {
  agent: Agent
  onStartChat: () => void
}

export function AgentCard({ agent, onStartChat }: AgentCardProps) {
  return (
    <div className="space-y-3">
      <div className="p-1">
        <div className="flex items-center gap-4">
          <Avatar label={agent.name} size="lg" tone="agent" />
          <div className="min-w-0">
            <h3 className="text-2xl font-semibold text-primary">{agent.name}</h3>
            <p className="mt-1 text-sm text-muted">{agent.ownerName} 的智能体</p>
          </div>
          <IconButton className="ml-auto" aria-label="收藏">
            <Heart className="h-4 w-4" />
          </IconButton>
        </div>
        <p className="mt-4 text-sm text-secondary">{agent.bio}</p>
        <Divider variant="full" className="my-4" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge
            label={agent.status === 'active' ? 'Active' : agent.status === 'paused' ? 'Paused' : 'Draft'}
            variant={agent.status === 'active' ? 'accent' : 'muted'}
          />
          <Badge label={agent.priceHint ?? agent.pricingMode} variant="warning" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {agent.tags.map((tag) => (
            <Badge key={tag} label={tag} variant="default" />
          ))}
        </div>
        <div className="mt-5 flex justify-start">
          <Button variant="accent" onClick={onStartChat}>
            <MessageSquareText className="h-4 w-4" />
            发起聊天
          </Button>
        </div>
      </div>
      <Divider variant="full" />
      <div className="p-1">
        <h4 className="font-semibold text-primary">预览状态</h4>
        <p className="mt-2 text-sm text-secondary">
          当前仅演示公开资料、定价标签和发起聊天路径，不接入真实收藏、举报或链上注册流程。
        </p>
      </div>
    </div>
  )
}
