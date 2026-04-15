import { MessageSquareText, Plus, X } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { useI18n } from '@/i18n'
import { localizeRelativeTimeToken } from '@/i18n/format'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types'

type ConversationDrawerProps = {
  open: boolean
  items: Conversation[]
  activeId: string | null
  canCreateSession?: boolean
  agentName?: string
  onClose: () => void
  onCreateSession?: () => void
  onSelect: (conversationId: string) => void
}

export function ConversationDrawer({
  open,
  items,
  activeId,
  canCreateSession = false,
  agentName,
  onClose,
  onCreateSession,
  onSelect,
}: ConversationDrawerProps) {
  const { locale, t } = useI18n()

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('actions.closeConversationList')}
        className={[
          'absolute inset-0 z-20 bg-black/20 transition',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />
      <aside
        className={[
          'absolute inset-y-0 right-0 z-30 flex w-full max-w-[360px] flex-col border-l border-default bg-surface shadow-xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-default px-4 py-4">
          <div>
            <h3 className="text-base font-semibold text-primary">{t('chat.sessionListTitle')}</h3>
            <p className="text-xs text-muted">
              {canCreateSession && agentName
                ? t('chat.sessionListDescriptionAgent', { name: agentName })
                : t('chat.sessionListDescription')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCreateSession && onCreateSession ? (
              <Button size="sm" variant="outline" onClick={onCreateSession}>
                <Plus className="h-4 w-4" />
                {t('actions.createConversation')}
              </Button>
            ) : null}
            <IconButton onClick={onClose} aria-label={t('actions.closeConversationList')}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length > 0 ? (
            <div>
              {items.map((item, index) => {
                const active = item.id === activeId

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id)
                      onClose()
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-default px-4 py-3 text-left transition',
                      active ? 'bg-muted' : 'bg-surface hover-bg-muted',
                    )}
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-secondary">
                      <MessageSquareText className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium text-primary">
                          {t('chat.sessionItemTitle', { index: index + 1 })}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted">
                          {localizeRelativeTimeToken(item.updatedAt, locale)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted">{item.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState
              eyebrow={t('nav.chat')}
              title={t('chat.noConversationTitle')}
              description={t('chat.noConversationDescription')}
            />
          )}
        </div>
      </aside>
    </>
  )
}
