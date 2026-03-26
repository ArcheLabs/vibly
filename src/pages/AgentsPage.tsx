import { useMemo, useState } from 'react'
import { PencilLine, Plus } from 'lucide-react'
import { AgentListItem } from '@/components/agents/AgentListItem'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchBar } from '@/components/common/SearchBar'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
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
        header={
          <div className="space-y-4">
            <SearchBar value={search} onChange={setSearch} placeholder="搜索我的智能体" />
            <div className="flex gap-3">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-pine px-4 py-3 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                新建智能体
              </button>
              <button
                type="button"
                className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"
              >
                筛选
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
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
          <div className="glass rounded-[32px] border border-white/70 p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  My Agent Detail
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
                  {selectedAgent.name}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-stone-600">{selectedAgent.bio}</p>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"
              >
                <PencilLine className="h-4 w-4" />
                预览版暂不编辑
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge label={selectedAgent.status} variant={selectedAgent.status === 'active' ? 'success' : 'muted'} />
              <Badge label={selectedAgent.visibility} variant="agent" />
              <Badge label={selectedAgent.priceHint ?? selectedAgent.pricingMode} variant="warning" />
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <section className="rounded-[28px] bg-white p-5">
                <h3 className="font-semibold text-ink">基础资料卡</h3>
                <p className="mt-3 text-sm text-stone-600">
                  当前展示名称、简介、可见性与收费摘要，便于后续直接替换成真实表单。
                </p>
              </section>
              <section className="rounded-[28px] bg-white p-5">
                <h3 className="font-semibold text-ink">最近活动摘要</h3>
                <p className="mt-3 text-sm text-stone-600">
                  最近一次被选为聊天身份，用于演示智能体页不依赖聊天页也能成立。
                </p>
              </section>
              <section className="rounded-[28px] bg-white p-5">
                <h3 className="font-semibold text-ink">状态与可见性</h3>
                <p className="mt-3 text-sm text-stone-600">
                  支持 `active / paused / draft`，但当前仅使用 mock 文案，不接链上注册状态。
                </p>
              </section>
              <section className="rounded-[28px] bg-white p-5">
                <h3 className="font-semibold text-ink">公开资料入口</h3>
                <button
                  type="button"
                  onClick={() => openAgentProfile(selectedAgent.id)}
                  className="mt-4 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white"
                >
                  打开智能体资料侧板
                </button>
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
