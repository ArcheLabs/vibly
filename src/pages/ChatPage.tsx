import { useMemo, useRef, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { Composer } from '@/components/chat/Composer'
import { ConversationList } from '@/components/chat/ConversationList'
import { IdentitySwitcher } from '@/components/chat/IdentitySwitcher'
import { MessageList } from '@/components/chat/MessageList'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchBar } from '@/components/common/SearchBar'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types'

type ChatFilter = 'all' | Conversation['state']

const chatFilterLabels: Array<{ key: ChatFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'empty', label: '无消息' },
  { key: 'restricted', label: '受限' },
  { key: 'paused', label: '停用' },
]

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
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState<ChatFilter>('all')
  const [identityOpen, setIdentityOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  useClickOutside(switcherRef, () => setIdentityOpen(false))

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const matchesSearch =
          !search ||
          `${conversation.title} ${conversation.humanName} ${conversation.agentName ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
        const matchesFilter = filter === 'all' || conversation.state === filter
        return matchesSearch && matchesFilter
      }),
    [conversations, filter, search],
  )

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
  const selectedMessages = selectedConversation
    ? conversationMessages[selectedConversation.id] ?? []
    : []
  const currentIdentity =
    identities.find(
      (identity) =>
        identity.id ===
        (selectedConversation
          ? conversationIdentityMap[selectedConversation.id]
          : identities[0]?.id),
    ) ?? identities[0]

  const composerDisabled =
    !selectedConversation ||
    selectedConversation.state === 'paused' ||
    selectedConversation.state === 'restricted'

  const composerHint = !selectedConversation
    ? '先选择一个会话'
    : selectedConversation.state === 'paused'
      ? '该智能体已暂停服务'
      : selectedConversation.state === 'restricted'
        ? '预览版中先禁用发送，强调收费限制'
        : '本地 mock 发送，不接入 API'

  return (
    <>
      <ListPanel
        header={
          <div className="space-y-4">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="搜索会话 / 用户 / 智能体"
            />
            <div className="flex gap-3">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                <Plus className="h-4 w-4" />
                新建会话
              </button>
              <button
                type="button"
                onClick={() => selectConversation(null)}
                className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600"
              >
                空白态
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {chatFilterLabels.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition',
                    filter === item.key
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {filteredConversations.length > 0 ? (
          <ConversationList
            items={filteredConversations}
            activeId={selectedConversationId}
            onSelect={selectConversation}
          />
        ) : (
          <EmptyState
            eyebrow="Conversations"
            title="暂无聊天"
            description="当前筛选结果为空。去发现页找一个智能体，直接跑通从发现到聊天的演示路径。"
            actionLabel="前往发现页"
            onAction={() => navigate('/discover')}
          />
        )}
      </ListPanel>
      <MainPanel>
        {!selectedConversation ? (
          <EmptyState
            eyebrow="Chat Empty"
            title="选择一个会话开始预览"
            description="聊天页支持正常态、无消息态、收费限制态和停用态。也可以直接从发现页发起聊天跳转回来。"
            actionLabel="前往发现页"
            onAction={() => navigate('/discover')}
          />
        ) : (
          <div className="glass relative flex h-full min-h-[720px] flex-col overflow-hidden rounded-[32px] border border-white/70 shadow-panel">
            <div className="relative" ref={switcherRef}>
              <ChatHeader
                conversation={selectedConversation}
                currentIdentity={currentIdentity}
                onOpenUserProfile={() => openUserProfile(selectedConversation.humanId)}
                onOpenAgentProfile={
                  selectedConversation.agentId
                    ? () => openAgentProfile(selectedConversation.agentId!)
                    : undefined
                }
                onToggleIdentitySwitcher={() => setIdentityOpen((open) => !open)}
                onClearSelection={() => selectConversation(null)}
              />
              {identityOpen ? (
                <IdentitySwitcher
                  identities={identities}
                  activeIdentityId={currentIdentity.id}
                  onSelect={(identityId) => {
                    switchIdentity(selectedConversation.id, identityId)
                    setIdentityOpen(false)
                  }}
                />
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {selectedConversation.state === 'restricted' ? (
                <div className="mb-4 rounded-[24px] border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  本轮预览把收费智能体会话明确展示为受限态，方便演示限制提示与不可发送状态。
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
              currentIdentityName={currentIdentity.name}
              disabled={composerDisabled}
              hint={composerHint}
            />
            <div className="flex items-center justify-between border-t border-white/40 px-6 py-3 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>聊天页优先完整实现，消息发送仅为本地演示。</span>
              </div>
              <span>{selectedConversation.subtitle}</span>
            </div>
          </div>
        )}
      </MainPanel>
    </>
  )
}
