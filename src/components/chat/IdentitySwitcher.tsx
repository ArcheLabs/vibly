import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Identity } from '@/types'

type IdentitySwitcherProps = {
  identities: Identity[]
  activeIdentityId: string
  onSelect: (identityId: string) => void
}

export function IdentitySwitcher({
  identities,
  activeIdentityId,
  onSelect,
}: IdentitySwitcherProps) {
  const { t } = useI18n()

  return (
    <div className="absolute right-0 top-[calc(100%+12px)] z-20 w-80 rounded-[28px] border border-stone-200 bg-white p-3 shadow-panel">
      <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
        {t('me.identity')}
      </p>
      <div className="space-y-2">
        {identities.map((identity) => {
          const active = identity.id === activeIdentityId
          return (
            <button
              key={identity.id}
              type="button"
              onClick={() => onSelect(identity.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition',
                active ? 'bg-stone-900 text-white' : 'bg-stone-50 hover:bg-stone-100',
              )}
            >
              <Avatar label={identity.name} tone={identity.kind === 'human' ? 'human' : 'agent'} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{identity.name}</p>
                <p className={cn('truncate text-xs', active ? 'text-white/70' : 'text-stone-500')}>
                  {identity.description}
                </p>
              </div>
              <Badge
                label={identity.kind === 'human' ? t('common.human') : t('common.agent')}
                variant={identity.kind === 'human' ? 'human' : 'agent'}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
