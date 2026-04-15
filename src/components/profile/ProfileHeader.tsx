import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/Avatar'

type ProfileHeaderProps = {
  title: string
  subtitle?: string
  description?: string
  avatarLabel: string
  avatarSrc?: string
  avatarTone?: 'human' | 'agent' | 'neutral'
  avatarAccessory?: ReactNode
  actions?: ReactNode
}

export function ProfileHeader({
  title,
  subtitle,
  description,
  avatarLabel,
  avatarSrc,
  avatarTone = 'agent',
  avatarAccessory,
  actions,
}: ProfileHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative">
            <Avatar label={avatarLabel} src={avatarSrc} size="lg" tone={avatarTone} />
            {avatarAccessory}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold text-primary">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {description ? <p className="max-w-2xl text-sm leading-6 text-secondary">{description}</p> : null}
    </div>
  )
}
