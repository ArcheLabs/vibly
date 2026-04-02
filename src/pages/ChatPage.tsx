import { useEffect, useMemo, useState } from 'react'
import { ListFilter, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { Composer } from '@/components/chat/Composer'
import { ConversationList } from '@/components/chat/ConversationList'
import { MessageList } from '@/components/chat/MessageList'
import { EmptyState } from '@/components/common/EmptyState'
import { useLayoutOverlay } from '@/components/layout/LayoutOverlayContext'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Divider } from '@/components/ui/Divider'
import { Dropdown } from '@/components/ui/Dropdown'
import { IconButton } from '@/components/ui/IconButton'
import { SearchBar } from '@/components/ui/SearchBar'
import { useI18n } from '@/i18n'
import { useAppContext } from '@/lib/app-context'

type HeaderTarget = 'human' | 'agent'
type ConversationFilter = 'all' | 'agent' | 'human'

export function ChatPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    conversationMessages,
    sendMessage,
    openAgentProfile,
    openUserProfile,
  } = useAppContext()
  const { closePanel } = useLayoutOverlay()

  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>('all')
  const [targetMenuOpen, setTargetMenuOpen] = useState(false)
  const [targetView, setTargetView] = useState<HeaderTarget>('human')

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const matchesSearch =
          !search ||
          `${conversation.title} ${conversation.humanName} ${conversation.agentName ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
        const matchesFilter =
          conversationFilter === 'all' ? true : conversation.targetType === conversationFilter
        return matchesSearch && matchesFilter
      }),
    [conversationFilter, conversations, search],
  )

  const filterLabelMap: Record<ConversationFilter, string> = {
    all: t('chat.filterAll'),
    agent: t('chat.filterAgentsOnly'),
    human: t('chat.filterHumansOnly'),
  }

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null

  useEffect(() => {
    if (!selectedConversation) return
    setTargetView(selectedConversation.targetType === 'agent' ? 'agent' : 'human')
  }, [selectedConversation?.id, selectedConversation?.targetType])

  const selectedMessages = selectedConversation
    ? conversationMessages[selectedConversation.id] ?? []
    : []

  const composerDisabled =
    !selectedConversation ||
    selectedConversation.state === 'paused' ||
    selectedConversation.state === 'restricted'

  const listHeader = (
    <div className="flex items-center gap-2">
      <SearchBar value={search} onChange={setSearch} placeholder={t('chat.searchPlaceholder')} />
      <Dropdown
        label={
          <span className="inline-flex items-center gap-1.5">
            <ListFilter className="h-4 w-4" />
            <span>{filterLabelMap[conversationFilter]}</span>
          </span>
        }
        open={filterMenuOpen}
        onOpenChange={setFilterMenuOpen}
        options={[
          {
            key: 'all',
            label: t('chat.filterAll'),
            active: conversationFilter === 'all',
            onSelect: () => setConversationFilter('all'),
          },
          {
            key: 'agent',
            label: t('chat.filterAgentsOnly'),
            active: conversationFilter === 'agent',
            onSelect: () => setConversationFilter('agent'),
          },
          {
            key: 'human',
            label: t('chat.filterHumansOnly'),
            active: conversationFilter === 'human',
            onSelect: () => setConversationFilter('human'),
          },
        ]}
      />
      <IconButton aria-label={t('actions.createConversation')}>
        <Plus className="h-4 w-4" />
      </IconButton>
    </div>
  )

  const listContent = filteredConversations.length > 0 ? (
    <ConversationList
      items={filteredConversations}
      activeId={selectedConversationId}
      onSelect={(conversationId) => {
        selectConversation(conversationId)
        closePanel()
      }}
    />
  ) : (
    <EmptyState
      eyebrow={t('nav.chat')}
      title={t('chat.noConversationTitle')}
      description={t('chat.noConversationDescription')}
      actionLabel={t('chat.noConversationAction')}
      onAction={() => navigate('/discover')}
    />
  )

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={listHeader}
      >
        {listContent}
      </ListPanel>

      <MainPanel className="p-0">
        {!selectedConversation ? (
          <div className="flex h-full flex-col gap-3">
            <EmptyState
              eyebrow={t('nav.chat')}
              title={t('chat.pickConversationTitle')}
              description={t('chat.pickConversationDescription')}
              actionLabel={t('chat.noConversationAction')}
              onAction={() => navigate('/discover')}
            />
          </div>
        ) : (
          <div className="flex h-full min-h-[640px] flex-col bg-surface">
            <ChatHeader
              conversation={selectedConversation}
              targetView={targetView}
              targetMenuOpen={targetMenuOpen}
              onTargetMenuOpenChange={setTargetMenuOpen}
              onTargetViewChange={(nextTarget) => {
                setTargetView(nextTarget)
                setTargetMenuOpen(false)
              }}
              onOpenTargetProfile={() => {
                if (targetView === 'agent' && selectedConversation.agentId) {
                  openAgentProfile(selectedConversation.agentId)
                  return
                }
                openUserProfile(selectedConversation.humanId)
              }}
            />
            <Divider variant="full" />

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 lg:px-4 lg:py-4">
              {selectedConversation.state === 'restricted' ? (
                <div className="mb-3 border border-default bg-muted px-3 py-2 text-xs text-secondary">
                  {t('chat.restrictedBanner')}
                </div>
              ) : null}
              <MessageList conversation={selectedConversation} messages={selectedMessages} />
            </div>
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => {
                sendMessage(selectedConversation.id, draft)
                setDraft('')
              }}
              disabled={composerDisabled}
            />
          </div>
        )}
      </MainPanel>
    </>
  )
}
