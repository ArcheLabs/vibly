import { useMemo } from 'react'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { PanelTitle } from '@/components/layout/PanelTitle'
import { Divider } from '@/components/ui/Divider'
import { WalletSummary } from '@/components/wallet/WalletSummary'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'

const walletTabs = [
  { key: 'overview', label: '资产', icon: Wallet },
  { key: 'income', label: '收入', icon: TrendingUp },
  { key: 'expense', label: '支出', icon: TrendingDown },
] as const

export function WalletPage() {
  const {
    walletSection,
    setWalletSection,
    walletRecords,
    walletSummary,
  } = useAppContext()

  const visibleRecords = useMemo(
    () =>
      walletSection === 'overview'
        ? walletRecords
        : walletRecords.filter((record) => record.type === walletSection),
    [walletRecords, walletSection],
  )

  const selectedRecord = visibleRecords[0] ?? null

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={<PanelTitle icon={Wallet} title="Wallet" />}
      >
        <div>
          {walletTabs.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setWalletSection(item.key)}
                className={cn(
                  'flex w-full items-center gap-2 border-b border-default px-3 py-3 text-sm transition',
                  walletSection === item.key ? 'bg-muted text-primary' : 'text-muted hover-bg-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </ListPanel>

      <MainPanel>
        <div className="space-y-4">
          {walletSection === 'overview' ? <WalletSummary summary={walletSummary} /> : null}

          {walletSection === 'income' ? (
            <div className="p-3">
              <h3 className="text-lg font-semibold text-primary">收入明细</h3>
              <p className="mt-2 text-sm text-secondary">共 {visibleRecords.length} 条收入记录。</p>
            </div>
          ) : null}

          {walletSection === 'expense' ? (
            <div className="p-3">
              <h3 className="text-lg font-semibold text-primary">支出明细</h3>
              <p className="mt-2 text-sm text-secondary">共 {visibleRecords.length} 条支出记录。</p>
            </div>
          ) : null}

          <Divider variant="full" />

          {selectedRecord ? (
            <div className="p-3">
              <h3 className="text-xl font-semibold text-primary">{selectedRecord.title}</h3>
              <Divider variant="full" className="my-3" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="app-subcard p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Amount</p>
                  <p className="mt-1 text-xl font-semibold text-primary">{selectedRecord.amount}</p>
                </div>
                <div className="app-subcard p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Time</p>
                  <p className="mt-1 text-xl font-semibold text-primary">{selectedRecord.time}</p>
                </div>
              </div>
              <div className="app-subcard mt-4 p-3 text-sm text-secondary">
                <p>{selectedRecord.remark}</p>
                <p className="mt-2">关联对象：{selectedRecord.relatedTo ?? '暂无'}</p>
              </div>
            </div>
          ) : (
            <EmptyState eyebrow="Wallet" title="暂无数据" description="右侧会展示当前分类的账单详情。" />
          )}
        </div>
      </MainPanel>
    </>
  )
}
