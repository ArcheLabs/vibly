import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import type { Agent } from '@/types'

type AgentCardProps = {
  agent: Agent
  onStartChat: () => void
}

export function AgentCard({ agent, onStartChat }: AgentCardProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar label={agent.name} size="lg" tone="agent" />
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-semibold text-ink">{agent.name}</h3>
            <p className="mt-1 text-sm text-stone-500">{agent.ownerName} 的智能体</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-stone-600">{agent.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge label={agent.status === 'active' ? 'Active' : agent.status === 'paused' ? 'Paused' : 'Draft'} variant={agent.status === 'active' ? 'success' : 'muted'} />
          <Badge label={agent.priceHint ?? agent.pricingMode} variant="warning" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {agent.tags.map((tag) => (
            <Badge key={tag} label={tag} variant="default" />
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onStartChat}
            className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            发起聊天
          </button>
          <button
            type="button"
            className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600"
          >
            收藏
          </button>
        </div>
      </div>
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <h4 className="font-semibold text-ink">预览状态</h4>
        <p className="mt-3 text-sm text-stone-600">
          当前仅演示公开资料、定价标签和发起聊天路径，不接入真实收藏、举报或链上注册流程。
        </p>
      </div>
    </div>
  )
}
