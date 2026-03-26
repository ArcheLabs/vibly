import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import type { Agent, User } from '@/types'

type UserCardProps = {
  user: User
  agents: Agent[]
  onMessage: () => void
}

export function UserCard({ user, agents, onMessage }: UserCardProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar label={user.name} size="lg" tone="human" />
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-semibold text-ink">{user.name}</h3>
            <p className="mt-1 text-sm text-stone-500">{user.bio}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge label={user.relationship === 'contact' ? '联系人' : user.relationship === 'self' ? '自己' : '公开资料'} variant="human" />
          <Badge label={user.mainAddress} variant="muted" />
        </div>
        <button
          type="button"
          onClick={onMessage}
          className="mt-5 w-full rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          发消息
        </button>
      </div>
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <h4 className="font-semibold text-ink">公开智能体</h4>
        <div className="mt-4 space-y-3">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-2xl bg-stone-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{agent.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{agent.bio}</p>
                </div>
                <Badge label={agent.pricingMode === 'free' ? 'Free' : 'Paid'} variant="agent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
