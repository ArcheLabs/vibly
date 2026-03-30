import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { IconButton } from '@/components/ui/IconButton'
import { SearchBar } from '@/components/ui/SearchBar'
import { useAppContext } from '@/lib/app-context'

type HeaderTarget = 'human' | 'agent'

export function ChatPage() {
  const navigate = useNavigate()
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    conversationMessages,
    conversationIdentityMap,
    identities,
    sendMessage,
    switchIdentity,
    openAgentProfile,
    openUserProfile,
  } = useAppContext()
  const { closePanel } = useLayoutOverlay()

  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
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
        return matchesSearch
      }),
    [conversations, search],
  )

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null

  useEffect(() => {
    if (!selectedConversation) return
    setTargetView(selectedConversation.targetType === 'agent' ? 'agent' : 'human')
  }, [selectedConversation?.id, selectedConversation?.targetType])

  const selectedMessages = selectedConversation
    ? conversationMessages[selectedConversation.id] ?? []
    : []

  const currentIdentityId = selectedConversation
    ? conversationIdentityMap[selectedConversation.id] ?? identities[0]?.id ?? ''
    : identities[0]?.id ?? ''

  const composerDisabled =
    !selectedConversation ||
    selectedConversation.state === 'paused' ||
    selectedConversation.state === 'restricted'

  const composerHint = !selectedConversation
    ? '先选择一个会话'
    : selectedConversation.state === 'paused'
      ? '该智能体已暂停服务'
      : selectedConversation.state === 'restricted'
        ? '该会话当前受限，暂不可发送'
        : '当前为本地 mock 消息发送'

  const listHeader = (
    <div className="flex items-center gap-2">
      <SearchBar value={search} onChange={setSearch} placeholder="搜索会话 / 用户 / 智能体" />
      <IconButton aria-label="新建会话">
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
      eyebrow="Conversations"
      title="暂无聊天"
      description="当前筛选结果为空。去发现页找一个智能体，直接跑通从发现到聊天的路径。"
      actionLabel="前往发现页"
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
              eyebrow="Chat Empty"
              title="选择一个会话开始预览"
              description="聊天页支持正常态、无消息态、收费限制态和停用态。也可以从发现页发起聊天。"
              actionLabel="前往发现页"
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
                  该会话当前处于受限状态，发送能力已关闭。
                </div>
              ) : null}
              <MessageList conversation={selectedConversation} messages={selectedMessages} />
            </div>

            <Divider variant="full" />
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => {
                sendMessage(selectedConversation.id, draft)
                setDraft('')
              }}
              identities={identities}
              currentIdentityId={currentIdentityId}
              onSwitchIdentity={(identityId) => switchIdentity(selectedConversation.id, identityId)}
              disabled={composerDisabled}
              hint={composerHint}
            />
          </div>
        )}
      </MainPanel>
    </>
  )
}
