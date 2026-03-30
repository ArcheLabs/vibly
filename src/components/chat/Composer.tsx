import { useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
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
    <div className="border-t border-default px-3 py-3 lg:px-4">
      <div className="flex items-center justify-between gap-2">
        <Dropdown
          label={`当前身份: ${currentIdentity?.name ?? '未知'}`}
          open={identityOpen}
          onOpenChange={setIdentityOpen}
          options={identities.map((identity) => ({
            key: identity.id,
            label: `${identity.kind === 'human' ? '真人' : '智能体'} · ${identity.name}`,
            active: identity.id === currentIdentityId,
            onSelect: () => onSwitchIdentity(identity.id),
          }))}
        />
        <span className="text-xs text-muted">{hint}</span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="输入消息"
          disabled={disabled}
          rows={3}
          className="min-h-[84px] w-full resize-none rounded-md border border-default bg-surface px-3 py-2 text-sm text-primary outline-none placeholder:text-muted disabled:cursor-not-allowed"
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
