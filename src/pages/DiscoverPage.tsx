import { useMemo, useState } from 'react'
import { Compass, PackageSearch } from 'lucide-react'
import { AgentListItem } from '@/components/agents/AgentListItem'
import { AgentCard } from '@/components/profile/AgentCard'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchBar } from '@/components/common/SearchBar'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'

export function DiscoverPage() {
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
        header={
          <div className="space-y-4">
            <SearchBar value={search} onChange={setSearch} placeholder="搜索热门智能体" />
            <div className="flex gap-2 rounded-full bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setDiscoverSection('featured')}
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-medium transition',
                  discoverSection === 'featured' ? 'bg-white text-ink shadow-sm' : 'text-stone-500',
                )}
              >
                热门智能体
              </button>
              <button
                type="button"
                onClick={() => setDiscoverSection('plugins')}
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-medium transition',
                  discoverSection === 'plugins' ? 'bg-white text-ink shadow-sm' : 'text-stone-500',
                )}
              >
                插件市场
              </button>
            </div>
          </div>
        }
      >
        {discoverSection === 'featured' ? (
          featured.length > 0 ? (
            <div className="space-y-3">
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
              eyebrow="Discover"
              title="暂无命中结果"
              description="当前搜索没有匹配的智能体，清空搜索即可回到推荐列表。"
            />
          )
        ) : (
          <div className="space-y-3">
            <div className="rounded-[24px] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <PackageSearch className="h-5 w-5 text-coral" />
                <div>
                  <p className="font-medium text-ink">插件市场</p>
                  <p className="text-xs text-stone-500">占位分组，当前仅验证信息架构</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ListPanel>
      <MainPanel>
        {discoverSection === 'plugins' ? (
          <EmptyState
            eyebrow="Plugin Market"
            title="产品经理正在思考中"
            description="发现页当前重点是找智能体并进入聊天，插件市场先保留明确占位，不提前引入额外基础设施。"
          />
        ) : selectedAgent ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Compass className="h-4 w-4" />
              从这里发起聊天后，会自动跳转到聊天页并选中预置会话。
            </div>
            <AgentCard agent={selectedAgent} onStartChat={() => startChatWithAgent(selectedAgent.id)} />
            <button
              type="button"
              onClick={() => openAgentProfile(selectedAgent.id)}
              className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600"
            >
              打开智能体信息侧板
            </button>
          </div>
        ) : (
          <EmptyState
            eyebrow="Discover"
            title="选择一个智能体"
            description="右侧将显示该智能体的公开资料和发起聊天按钮。"
          />
        )}
      </MainPanel>
    </>
  )
}
