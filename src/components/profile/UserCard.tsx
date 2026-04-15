import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { useI18n } from '@/i18n'
import { getPricingLabel, getRelationshipLabel } from '@/i18n/labels'
import type { Agent, User } from '@/types'

type UserCardProps = {
  user: User
  agents: Agent[]
  onMessage: () => void
}

export function UserCard({ user, agents, onMessage }: UserCardProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      <div className="p-3">
        <div className="flex items-center gap-4">
          <Avatar label={user.name} src={user.avatar} size="lg" tone="human" />
          <div className="min-w-0">
            <h3 className="text-2xl font-semibold text-primary">{user.name}</h3>
            <p className="mt-1 text-sm text-muted">{user.bio}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge label={getRelationshipLabel(user.relationship, t)} variant="default" />
          <Badge label={user.mainAddress} variant="muted" />
        </div>
        <Button className="mt-5 w-full" variant="accent" onClick={onMessage}>
          {t('actions.message')}
        </Button>
      </div>
      <Divider variant="full" />
      <div className="p-3">
        <h4 className="font-semibold text-primary">{t('profile.publicAgents')}</h4>
        <div className="mt-4 space-y-3">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-2xl bg-muted p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-primary">{agent.name}</p>
                  <p className="mt-1 text-xs text-muted">{agent.bio}</p>
                </div>
                <Badge label={getPricingLabel(agent.pricingMode, t)} variant="accent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
