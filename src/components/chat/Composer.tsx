import { useRef, useState } from 'react'
import { Send, Smile } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
}

const emojiOptions = ['😀', '😂', '🥹', '😍', '🤝', '🔥', '🎉', '🚀', '🌈', '💡', '🫶', '🙏']

export function Composer({ value, onChange, onSend }: ComposerProps) {
  const { t } = useI18n()
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useClickOutside(containerRef, () => setEmojiMenuOpen(false))

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    const selectionStart = textarea?.selectionStart ?? value.length
    const selectionEnd = textarea?.selectionEnd ?? value.length
    const nextValue = `${value.slice(0, selectionStart)}${emoji}${value.slice(selectionEnd)}`

    onChange(nextValue)
    setEmojiMenuOpen(false)

    window.requestAnimationFrame(() => {
      if (!textareaRef.current) return
      const caretPosition = selectionStart + emoji.length
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(caretPosition, caretPosition)
    })
  }

  return (
    <div className="bg-muted/60 px-3 py-4 lg:px-4">
      <div className="overflow-hidden rounded-3xl border border-default bg-[color-mix(in_srgb,var(--bg-surface)_90%,var(--bg-muted))] shadow-sm">
        <div
          ref={containerRef}
          className="relative flex items-center gap-2 rounded-t-3xl rounded-b-none bg-[color-mix(in_srgb,var(--bg-muted)_84%,var(--bg-surface))] px-3 py-2"
        >
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-3 text-secondary"
            onClick={() => setEmojiMenuOpen((open) => !open)}
            aria-label={t('chat.emoji')}
          >
            <Smile className="h-4 w-4" />
          </Button>
          {emojiMenuOpen ? (
            <div className="absolute left-3 top-[calc(100%+8px)] z-20 w-[224px] rounded-2xl border border-default bg-surface p-2 shadow-lg">
              <div className="grid grid-cols-6 gap-1">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className={cn(
                      'flex h-9 items-center justify-center rounded-xl text-lg transition',
                      'hover-bg-muted',
                    )}
                    aria-label={`${t('chat.emoji')} ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-end gap-2 px-3 py-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={t('chat.inputPlaceholder')}
            rows={3}
            className="min-h-[84px] w-full resize-none rounded-2xl border-0 bg-transparent px-1 py-2 text-sm text-primary outline-none placeholder:text-muted"
          />
          <Button
            variant={value.trim().length > 0 ? 'accent' : 'muted'}
            onClick={onSend}
            disabled={value.trim().length === 0}
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
