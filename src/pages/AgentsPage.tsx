import { useMemo, useState } from 'react'
import { Lock, PencilLine, Plus } from 'lucide-react'
import { AgentListItem } from '@/components/agents/AgentListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { IconButton } from '@/components/ui/IconButton'
import { SearchBar } from '@/components/ui/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { useI18n } from '@/i18n'
import { getAgentStatusLabel, getPricingLabel, getVisibilityLabel } from '@/i18n/labels'
import { useAppContext } from '@/lib/app-context'

export function AgentsPage() {
  const { t } = useI18n()
  const { agents, agentsSelectedId, setAgentsSelectedId, openAgentProfile } = useAppContext()
  const [search, setSearch] = useState('')

  const myAgents = useMemo(
    () =>
      agents.filter(
        (agent) =>
          agent.ownerName === 'libingjiang' &&
          `${agent.name} ${agent.bio}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [agents, search],
  )

  const selectedAgent = myAgents.find((agent) => agent.id === agentsSelectedId) ?? myAgents[0]

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder={t('agents.searchPlaceholder')} />
            <IconButton aria-label={t('actions.createAgent')}>
              <Plus className="h-4 w-4" />
            </IconButton>
          </div>
        }
      >
        <div>
          {myAgents.map((agent) => (
            <AgentListItem
              key={agent.id}
              agent={agent}
              active={agent.id === selectedAgent?.id}
              onClick={() => setAgentsSelectedId(agent.id)}
            />
          ))}
        </div>
      </ListPanel>

      <MainPanel>
        {selectedAgent ? (
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar label={selectedAgent.name} size="lg" tone="agent" />
                  {selectedAgent.visibility === 'private' ? (
                    <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-default bg-surface text-secondary">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-primary">{selectedAgent.name}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-secondary">{selectedAgent.bio}</p>
                </div>
              </div>
              <Button variant="outline">
                <PencilLine className="h-4 w-4" />
                {t('agents.notEditable')}
              </Button>
            </div>
            <Divider variant="full" className="my-4" />

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                label={getAgentStatusLabel(selectedAgent.status, t)}
                variant={selectedAgent.status === 'active' ? 'accent' : 'muted'}
              />
              <Badge label={getVisibilityLabel(selectedAgent.visibility, t)} variant="default" />
              <Badge label={selectedAgent.priceHint ?? getPricingLabel(selectedAgent.pricingMode, t)} variant="warning" />
            </div>
            <Divider variant="inset" className="my-4" />

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <section className="p-3">
                <h3 className="text-sm font-semibold text-primary">{t('agents.sectionBasic')}</h3>
                <p className="mt-2 text-sm text-secondary">{t('agents.sectionBasicDesc')}</p>
              </section>
              <section className="p-3">
                <h3 className="text-sm font-semibold text-primary">{t('agents.sectionActivity')}</h3>
                <p className="mt-2 text-sm text-secondary">{t('agents.sectionActivityDesc')}</p>
              </section>
              <section className="p-3">
                <h3 className="text-sm font-semibold text-primary">{t('agents.sectionStatus')}</h3>
                <p className="mt-2 text-sm text-secondary">{t('agents.sectionStatusDesc')}</p>
              </section>
              <section className="p-3">
                <h3 className="text-sm font-semibold text-primary">{t('agents.sectionProfile')}</h3>
                <Button className="mt-3" variant="accent" onClick={() => openAgentProfile(selectedAgent.id)}>
                  {t('agents.openProfilePanel')}
                </Button>
              </section>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow={t('nav.agents')}
            title={t('agents.emptyTitle')}
            description={t('agents.emptyDescription')}
          />
        )}
      </MainPanel>
    </>
  )
}
