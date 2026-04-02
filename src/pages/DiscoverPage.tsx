import { useMemo, useState } from 'react'
import { Boxes, Flame, PackageSearch } from 'lucide-react'
import { AgentListItem } from '@/components/agents/AgentListItem'
import { AgentCard } from '@/components/profile/AgentCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { SearchBar } from '@/components/ui/SearchBar'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/i18n'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'

export function DiscoverPage() {
  const { t } = useI18n()
  const {
    agents,
    featuredAgentIds,
    discoverSection,
    setDiscoverSection,
    selectedFeaturedAgentId,
    setSelectedFeaturedAgentId,
    startChatWithAgent,
    openAgentProfile,
  } = useAppContext()
  const [search, setSearch] = useState('')
  const featured = useMemo(
    () =>
      featuredAgentIds
        .map((id) => agents.find((agent) => agent.id === id))
        .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent))
        .filter((agent) =>
          `${agent.name} ${agent.bio} ${agent.tags.join(' ')}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    [agents, featuredAgentIds, search],
  )
  const selectedAgent = featured.find((agent) => agent.id === selectedFeaturedAgentId) ?? featured[0]

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={
          <div className="space-y-3">
            <SearchBar value={search} onChange={setSearch} placeholder={t('discover.searchPlaceholder')} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscoverSection('featured')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 text-sm text-muted transition hover-bg-muted',
                  discoverSection === 'featured' && 'border border-default bg-surface text-primary',
                )}
              >
                <Flame className="h-4 w-4" />
                {t('discover.tabFeatured')}
              </button>
              <button
                type="button"
                onClick={() => setDiscoverSection('plugins')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 text-sm text-muted transition hover-bg-muted',
                  discoverSection === 'plugins' && 'border border-default bg-surface text-primary',
                )}
              >
                <Boxes className="h-4 w-4" />
                {t('discover.tabPlugins')}
              </button>
            </div>
          </div>
        }
      >
        {discoverSection === 'featured' ? (
          featured.length > 0 ? (
            <div>
              {featured.map((agent) => (
                <AgentListItem
                  key={agent.id}
                  agent={agent}
                  active={agent.id === selectedAgent?.id}
                  onClick={() => setSelectedFeaturedAgentId(agent.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow={t('nav.discover')}
              title={t('discover.noResultTitle')}
              description={t('discover.noResultDescription')}
            />
          )
        ) : (
          <div className="p-3">
            <div className="app-subcard p-3">
              <div className="flex items-center gap-3">
                <PackageSearch className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-primary">{t('discover.tabPlugins')}</p>
                  <p className="text-xs text-muted">{t('discover.pluginPlaceholder')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ListPanel>
      <MainPanel>
        {discoverSection === 'plugins' ? (
          <EmptyState
            eyebrow={t('discover.tabPlugins')}
            title={t('discover.pluginTitle')}
            description={t('discover.pluginDescription')}
          />
        ) : selectedAgent ? (
          <div className="space-y-3">
            <AgentCard agent={selectedAgent} onStartChat={() => startChatWithAgent(selectedAgent.id)} />
            <div className="flex justify-center">
              <Button size="sm" variant="outline" onClick={() => openAgentProfile(selectedAgent.id)}>
                {t('actions.openAgentProfile')}
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow={t('nav.discover')}
            title={t('discover.pickTitle')}
            description={t('discover.pickDescription')}
          />
        )}
      </MainPanel>
    </>
  )
}
