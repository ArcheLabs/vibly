import { useMemo, useState } from 'react'
import { ChevronDown, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Identity } from '@/types'

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  identities: Identity[]
  currentIdentityId: string
  onSwitchIdentity: (identityId: string) => void
  disabled?: boolean
  hint: string
}

export function Composer({
  value,
  onChange,
  onSend,
  identities,
  currentIdentityId,
  onSwitchIdentity,
  disabled,
  hint,
}: ComposerProps) {
  const [identityOpen, setIdentityOpen] = useState(false)
  const currentIdentity = useMemo(
    () => identities.find((identity) => identity.id === currentIdentityId) ?? identities[0],
    [currentIdentityId, identities],
  )

  return (
    <div className="px-3 py-3 lg:px-4">
      <div className="relative flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIdentityOpen(!identityOpen)}
          className="inline-flex items-center gap-2 text-sm text-secondary hover-text-primary"
        >
          <Avatar
            label={currentIdentity?.name ?? '未知'}
            size="sm"
            tone={currentIdentity?.kind === 'agent' ? 'agent' : 'human'}
          />
          <span>{currentIdentity?.name ?? '未知'}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted">{hint}</span>
        {identityOpen ? (
          <div className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[220px] rounded-2xl border border-default bg-surface p-1.5">
            {identities.map((identity) => (
              <button
                key={identity.id}
                type="button"
                onClick={() => {
                  onSwitchIdentity(identity.id)
                  setIdentityOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
                  identity.id === currentIdentityId ? 'bg-muted text-primary' : 'text-secondary hover-bg-muted',
                )}
              >
                <Avatar
                  label={identity.name}
                  size="sm"
                  tone={identity.kind === 'agent' ? 'agent' : 'human'}
                />
                <span>{identity.name}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="输入消息"
          disabled={disabled}
          rows={3}
          className="min-h-[84px] w-full resize-none rounded-2xl border-0 bg-transparent px-1 py-2 text-sm text-primary outline-none placeholder:text-muted disabled:cursor-not-allowed"
        />
        <Button
          variant={value.trim().length > 0 && !disabled ? 'accent' : 'muted'}
          onClick={onSend}
          disabled={disabled || value.trim().length === 0}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
          发送
        </Button>
      </div>
    </div>
  )
}
