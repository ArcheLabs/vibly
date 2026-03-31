import { Send, Smile } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/i18n'

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export function Composer({ value, onChange, onSend, disabled }: ComposerProps) {
  const { t } = useI18n()

  return (
    <div className="bg-muted/60 px-3 py-4 lg:px-4">
      <div className="overflow-hidden rounded-3xl border border-default bg-[color-mix(in_srgb,var(--bg-surface)_90%,var(--bg-muted))] shadow-sm">
        <div className="flex items-center gap-2 rounded-t-3xl rounded-b-none bg-[color-mix(in_srgb,var(--bg-muted)_84%,var(--bg-surface))] px-3 py-2">
          <Button variant="ghost" size="sm" className="rounded-full px-3 text-secondary">
            <Smile className="h-4 w-4" />
            {t('chat.emoji')}
          </Button>
        </div>
        <div className="flex items-end gap-2 px-3 py-3">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={t('chat.inputPlaceholder')}
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
            {t('actions.send')}
          </Button>
        </div>
      </div>
    </div>
  )
}
