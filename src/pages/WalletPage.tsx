import { useMemo } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { WalletRecordItem } from '@/components/wallet/WalletRecordItem'
import { WalletSummary } from '@/components/wallet/WalletSummary'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'

export function WalletPage() {
  const {
    walletSection,
    setWalletSection,
    walletRecords,
    selectedWalletRecordId,
    setSelectedWalletRecordId,
    walletSummary,
  } = useAppContext()

  const visibleRecords = useMemo(
    () =>
      walletSection === 'overview'
        ? walletRecords
        : walletRecords.filter((record) => record.type === walletSection),
    [walletRecords, walletSection],
  )

  const selectedRecord =
    visibleRecords.find((record) => record.id === selectedWalletRecordId) ?? visibleRecords[0] ?? null

  return (
    <>
      <ListPanel
        header={
          <div className="space-y-4">
            <div className="flex gap-2 rounded-full bg-stone-100 p-1">
              {[
                { key: 'overview', label: '资产总览' },
                { key: 'income', label: '收入' },
                { key: 'expense', label: '支出' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setWalletSection(item.key as typeof walletSection)}
                  className={cn(
                    'flex-1 rounded-full px-4 py-2 text-sm font-medium transition',
                    walletSection === item.key ? 'bg-white text-ink shadow-sm' : 'text-stone-500',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {visibleRecords.length > 0 ? (
          <div className="space-y-3">
            {visibleRecords.map((record) => (
              <WalletRecordItem
                key={record.id}
                record={record}
                active={record.id === selectedRecord?.id}
                onClick={() => setSelectedWalletRecordId(record.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Wallet Empty"
            title="当前筛选下无记录"
            description="钱包页也保留空状态，后续接链上数据时不用再改布局。"
          />
        )}
      </ListPanel>
      <MainPanel>
        <div className="space-y-4">
          <WalletSummary summary={walletSummary} />
          {selectedRecord ? (
            <div className="glass rounded-[32px] border border-white/70 p-6 shadow-panel">
              <h3 className="font-display text-2xl font-semibold text-ink">{selectedRecord.title}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Amount</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{selectedRecord.amount}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Time</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{selectedRecord.time}</p>
                </div>
              </div>
              <div className="mt-4 rounded-[24px] bg-white p-4 text-sm text-stone-600">
                <p>{selectedRecord.remark}</p>
                <p className="mt-2">关联对象：{selectedRecord.relatedTo ?? '暂无'}</p>
              </div>
            </div>
          ) : null}
        </div>
      </MainPanel>
    </>
  )
}
