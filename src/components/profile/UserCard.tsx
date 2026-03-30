import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import type { Agent, User } from '@/types'

type UserCardProps = {
  user: User
  agents: Agent[]
  onMessage: () => void
}

export function UserCard({ user, agents, onMessage }: UserCardProps) {
  return (
    <div className="space-y-3">
      <div className="p-3">
        <div className="flex items-center gap-4">
          <Avatar label={user.name} size="lg" tone="human" />
          <div className="min-w-0">
            <h3 className="text-2xl font-semibold text-primary">{user.name}</h3>
            <p className="mt-1 text-sm text-muted">{user.bio}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge label={user.relationship === 'contact' ? '联系人' : user.relationship === 'self' ? '自己' : '公开资料'} variant="default" />
          <Badge label={user.mainAddress} variant="muted" />
        </div>
        <Button className="mt-5 w-full" variant="accent" onClick={onMessage}>
          发消息
        </Button>
      </div>
      <Divider variant="full" />
      <div className="p-3">
        <h4 className="font-semibold text-primary">公开智能体</h4>
        <div className="mt-4 space-y-3">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-2xl bg-muted p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-primary">{agent.name}</p>
                  <p className="mt-1 text-xs text-muted">{agent.bio}</p>
                </div>
                <Badge label={agent.pricingMode === 'free' ? 'Free' : 'Paid'} variant="accent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
