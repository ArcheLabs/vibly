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
import { useI18n } from '@/i18n'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'

export function ContactsPage() {
  const { t } = useI18n()
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
              <SearchBar value={search} onChange={setSearch} placeholder={t('contacts.searchPlaceholder')} />
              <IconButton aria-label={t('actions.addContact')}>
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
                {t('contacts.tabContacts')}
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
                {t('contacts.tabRequests')}
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
              eyebrow={t('contacts.tabContacts')}
              title={t('contacts.noContactsTitle')}
              description={t('contacts.noContactsDescription')}
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
            eyebrow={t('contacts.tabRequests')}
            title={t('contacts.noRequestsTitle')}
            description={t('contacts.noRequestsDescription')}
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
                    ? t('common.ownerAgent', { name: selectedContact.ownerName ?? '' })
                    : selectedContact.bio}
                </p>
              </div>
            </div>
            <Divider variant="full" className="my-4" />
            <p className="mt-4 max-w-2xl text-sm text-secondary">
              {t('contacts.intro')}
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
                {t('actions.message')}
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
                {t('actions.accept')}
              </Button>
              <Button
                onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                variant="outline"
              >
                <X className="h-4 w-4" />
                {t('actions.reject')}
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow={t('contacts.tabContacts')}
            title={t('contacts.pickTitle')}
            description={t('contacts.pickDescription')}
          />
        )}
      </MainPanel>
    </>
  )
}
