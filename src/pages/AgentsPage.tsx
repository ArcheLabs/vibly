import { useMemo, useState } from 'react'
import { PencilLine, Plus } from 'lucide-react'
import { AgentListItem } from '@/components/agents/AgentListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { IconButton } from '@/components/ui/IconButton'
import { SearchBar } from '@/components/ui/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { useAppContext } from '@/lib/app-context'

export function AgentsPage() {
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
            <SearchBar value={search} onChange={setSearch} placeholder="搜索我的智能体" />
            <IconButton aria-label="新建智能体">
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
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">My Agent Detail</p>
                <h2 className="mt-2 text-2xl font-semibold text-primary">{selectedAgent.name}</h2>
                <p className="mt-2 max-w-2xl text-sm text-secondary">{selectedAgent.bio}</p>
              </div>
              <Button variant="outline">
                <PencilLine className="h-4 w-4" />
                预览版暂不编辑
              </Button>
            </div>
            <Divider variant="full" className="my-4" />

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge label={selectedAgent.status} variant={selectedAgent.status === 'active' ? 'accent' : 'muted'} />
              <Badge label={selectedAgent.visibility} variant="default" />
              <Badge label={selectedAgent.priceHint ?? selectedAgent.pricingMode} variant="warning" />
            </div>
            <Divider variant="inset" className="my-4" />

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <section className="p-3">
                <h3 className="text-sm font-semibold text-primary">基础资料卡</h3>
                <p className="mt-2 text-sm text-secondary">当前展示名称、简介、可见性与收费摘要。</p>
              </section>
              <section className="p-3">
                <h3 className="text-sm font-semibold text-primary">最近活动摘要</h3>
                <p className="mt-2 text-sm text-secondary">最近一次被选为聊天身份，用于演示跨页联动。</p>
              </section>
              <section className="p-3">
                <h3 className="text-sm font-semibold text-primary">状态与可见性</h3>
                <p className="mt-2 text-sm text-secondary">支持 active / paused / draft，当前为 mock 文案。</p>
              </section>
              <section className="p-3">
                <h3 className="text-sm font-semibold text-primary">公开资料入口</h3>
                <Button className="mt-3" variant="accent" onClick={() => openAgentProfile(selectedAgent.id)}>
                  打开智能体资料侧板
                </Button>
              </section>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow="Agents"
            title="先选择一个智能体"
            description="智能体页保留标准列表 + 详情结构，便于后续接入真实管理能力。"
          />
        )}
      </MainPanel>
    </>
  )
}
