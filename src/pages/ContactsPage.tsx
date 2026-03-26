import { useMemo, useState } from 'react'
import { Check, MessageSquareText, UserPlus, X } from 'lucide-react'
import { ContactListItem } from '@/components/contacts/ContactListItem'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchBar } from '@/components/common/SearchBar'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'

export function ContactsPage() {
  const {
    contacts,
    contactRequests,
    contactsSection,
    selectedContactId,
    selectedRequestId,
    setContactsSection,
    setSelectedContactId,
    setSelectedRequestId,
    startChatWithAgent,
    startChatWithUser,
    openAgentProfile,
    openUserProfile,
    updateRequestStatus,
  } = useAppContext()
  const [search, setSearch] = useState('')

  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) =>
        `${contact.name} ${contact.bio} ${contact.ownerName ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [contacts, search],
  )
  const filteredRequests = useMemo(
    () =>
      contactRequests.filter((request) =>
        `${request.name} ${request.requestNote ?? ''}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [contactRequests, search],
  )

  const selectedContact = filteredContacts.find((contact) => contact.id === selectedContactId) ?? filteredContacts[0]
  const selectedRequest = filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0]

  return (
    <>
      <ListPanel
        header={
          <div className="space-y-4">
            <SearchBar value={search} onChange={setSearch} placeholder="搜索联系人或申请" />
            <div className="flex gap-3">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-coral px-4 py-3 text-sm font-medium text-white"
              >
                <UserPlus className="h-4 w-4" />
                添加联系人
              </button>
            </div>
            <div className="flex gap-2 rounded-full bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setContactsSection('contacts')}
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-medium transition',
                  contactsSection === 'contacts' ? 'bg-white text-ink shadow-sm' : 'text-stone-500',
                )}
              >
                联系人
              </button>
              <button
                type="button"
                onClick={() => setContactsSection('requests')}
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-medium transition',
                  contactsSection === 'requests' ? 'bg-white text-ink shadow-sm' : 'text-stone-500',
                )}
              >
                申请
              </button>
            </div>
          </div>
        }
      >
        {contactsSection === 'contacts' ? (
          filteredContacts.length > 0 ? (
            <div className="space-y-3">
              {filteredContacts.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  active={contact.id === selectedContact?.id}
                  onClick={() => setSelectedContactId(contact.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="Contacts"
              title="暂无联系人"
              description="联系人页保留空状态，后续可以直接接真实关系链路。"
            />
          )
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <ContactListItem
                key={request.id}
                contact={request}
                active={request.id === selectedRequest?.id}
                onClick={() => setSelectedRequestId(request.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Requests"
            title="暂无待处理申请"
            description="申请列表也保留空状态，便于后续替换成正式实现。"
          />
        )}
      </ListPanel>
      <MainPanel>
        {contactsSection === 'contacts' && selectedContact ? (
          <div className="glass rounded-[32px] border border-white/70 p-6 shadow-panel">
            <div className="flex items-center gap-4">
              <Avatar
                label={selectedContact.name}
                size="lg"
                tone={selectedContact.kind === 'agent' ? 'agent' : 'human'}
              />
              <div>
                <h2 className="font-display text-3xl font-semibold text-ink">{selectedContact.name}</h2>
                <p className="mt-2 text-sm text-stone-600">
                  {selectedContact.kind === 'agent'
                    ? `${selectedContact.ownerName} 的智能体`
                    : selectedContact.bio}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge
                label={selectedContact.kind === 'agent' ? '智能体' : '真人'}
                variant={selectedContact.kind === 'agent' ? 'agent' : 'human'}
              />
              <Badge label="已建立关系" variant="success" />
            </div>
            <p className="mt-6 max-w-2xl text-sm text-stone-600">
              联系人页承担“查看关系对象并进入聊天”的入口职责。当前按钮全部使用本地状态，不触发真实联系人操作。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  selectedContact.kind === 'agent'
                    ? startChatWithAgent(selectedContact.id)
                    : startChatWithUser(selectedContact.id)
                }
                className="flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white"
              >
                <MessageSquareText className="h-4 w-4" />
                发消息
              </button>
              <button
                type="button"
                onClick={() =>
                  selectedContact.kind === 'agent'
                    ? openAgentProfile(selectedContact.id)
                    : openUserProfile(selectedContact.id)
                }
                className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600"
              >
                打开资料
              </button>
            </div>
          </div>
        ) : contactsSection === 'requests' && selectedRequest ? (
          <div className="glass rounded-[32px] border border-white/70 p-6 shadow-panel">
            <div className="flex items-center gap-4">
              <Avatar label={selectedRequest.name} size="lg" tone="human" />
              <div>
                <h2 className="font-display text-3xl font-semibold text-ink">{selectedRequest.name}</h2>
                <p className="mt-2 text-sm text-stone-600">{selectedRequest.bio}</p>
              </div>
            </div>
            <p className="mt-6 rounded-[24px] bg-white p-4 text-sm text-stone-600">
              {selectedRequest.requestNote}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Badge label={selectedRequest.status ?? 'pending'} variant="warning" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateRequestStatus(selectedRequest.id, 'accepted')}
                className="flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white"
              >
                <Check className="h-4 w-4" />
                接受
              </button>
              <button
                type="button"
                onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600"
              >
                <X className="h-4 w-4" />
                拒绝
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow="Contacts"
            title="选择一个对象查看详情"
            description="联系人与申请都保持列表 + 详情结构，方便切换和演示。"
          />
        )}
      </MainPanel>
    </>
  )
}
