import { useMemo, useState } from 'react'
import { Check, MessageSquareText, UserPlus, Users, UserRoundCheck, X } from 'lucide-react'
import { ContactListItem } from '@/components/contacts/ContactListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { IconButton } from '@/components/ui/IconButton'
import { SearchBar } from '@/components/ui/SearchBar'
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
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <SearchBar value={search} onChange={setSearch} placeholder="搜索联系人或申请" />
              <IconButton aria-label="添加联系人">
                <UserPlus className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContactsSection('contacts')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-full px-4 py-2 text-sm text-muted transition hover-bg-muted',
                  contactsSection === 'contacts' && 'border border-default bg-surface text-primary',
                )}
              >
                <Users className="h-4 w-4" />
                联系人
              </button>
              <button
                type="button"
                onClick={() => setContactsSection('requests')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-full px-4 py-2 text-sm text-muted transition hover-bg-muted',
                  contactsSection === 'requests' && 'border border-default bg-surface text-primary',
                )}
              >
                <UserRoundCheck className="h-4 w-4" />
                申请
              </button>
            </div>
          </div>
        }
      >
        {contactsSection === 'contacts' ? (
          filteredContacts.length > 0 ? (
            <div>
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
          <div>
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
          <div className="p-3">
            <div className="flex items-center gap-4">
              <Avatar
                label={selectedContact.name}
                size="lg"
                tone={selectedContact.kind === 'agent' ? 'agent' : 'human'}
              />
              <div>
                <h2 className="text-2xl font-semibold text-primary">{selectedContact.name}</h2>
                <p className="mt-1.5 text-sm text-secondary">
                  {selectedContact.kind === 'agent'
                    ? `${selectedContact.ownerName} 的智能体`
                    : selectedContact.bio}
                </p>
              </div>
            </div>
            <Divider variant="full" className="my-4" />
            <p className="mt-4 max-w-2xl text-sm text-secondary">
              联系人页承担“查看关系对象并进入聊天”的入口职责。当前按钮全部使用本地状态，不触发真实联系人操作。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  selectedContact.kind === 'agent'
                    ? startChatWithAgent(selectedContact.id)
                    : startChatWithUser(selectedContact.id)
                }
                variant="accent"
              >
                <MessageSquareText className="h-4 w-4" />
                发消息
              </Button>
            </div>
          </div>
        ) : contactsSection === 'requests' && selectedRequest ? (
          <div className="p-3">
            <div className="flex items-center gap-4">
              <Avatar label={selectedRequest.name} size="lg" tone="human" />
              <div>
                <h2 className="text-2xl font-semibold text-primary">{selectedRequest.name}</h2>
                <p className="mt-1.5 text-sm text-secondary">{selectedRequest.bio}</p>
              </div>
            </div>
            <p className="app-subcard mt-4 p-3 text-sm text-secondary">
              {selectedRequest.requestNote}
            </p>
            <Divider variant="full" className="my-4" />
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={() => updateRequestStatus(selectedRequest.id, 'accepted')}
                variant="accent"
              >
                <Check className="h-4 w-4" />
                接受
              </Button>
              <Button
                onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                variant="outline"
              >
                <X className="h-4 w-4" />
                拒绝
              </Button>
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
