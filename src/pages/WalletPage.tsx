import { useMemo } from 'react'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { PanelTitle } from '@/components/layout/PanelTitle'
import { Divider } from '@/components/ui/Divider'
import { WalletSummary } from '@/components/wallet/WalletSummary'
import { useI18n } from '@/i18n'
import { formatAmountByLocale, formatNumberByLocale, localizeRelativeTimeToken } from '@/i18n/format'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import type { WalletSection } from '@/types'

const walletTabs: Array<{ key: WalletSection; labelKey: string; icon: typeof Wallet }> = [
  { key: 'overview', labelKey: 'wallet.assets', icon: Wallet },
  { key: 'income', labelKey: 'wallet.income', icon: TrendingUp },
  { key: 'expense', labelKey: 'wallet.expense', icon: TrendingDown },
]

export function WalletPage() {
  const { locale, t } = useI18n()
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
        header={<PanelTitle icon={Wallet} title={t('panelTitle.wallet')} />}
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
                <span>{t(item.labelKey)}</span>
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
              <h3 className="text-lg font-semibold text-primary">{t('wallet.incomeTitle')}</h3>
              <p className="mt-2 text-sm text-secondary">
                {t('wallet.incomeCount', { count: formatNumberByLocale(visibleRecords.length, locale) })}
              </p>
            </div>
          ) : null}

          {walletSection === 'expense' ? (
            <div className="p-3">
              <h3 className="text-lg font-semibold text-primary">{t('wallet.expenseTitle')}</h3>
              <p className="mt-2 text-sm text-secondary">
                {t('wallet.expenseCount', { count: formatNumberByLocale(visibleRecords.length, locale) })}
              </p>
            </div>
          ) : null}

          <Divider variant="full" />

          {selectedRecord ? (
            <div className="p-3">
              <h3 className="text-xl font-semibold text-primary">{selectedRecord.title}</h3>
              <Divider variant="full" className="my-3" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="app-subcard p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">{t('common.amount')}</p>
                  <p className="mt-1 text-xl font-semibold text-primary">
                    {formatAmountByLocale(selectedRecord.amount, locale)}
                  </p>
                </div>
                <div className="app-subcard p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">{t('common.time')}</p>
                  <p className="mt-1 text-xl font-semibold text-primary">
                    {localizeRelativeTimeToken(selectedRecord.time, locale)}
                  </p>
                </div>
              </div>
              <div className="app-subcard mt-4 p-3 text-sm text-secondary">
                <p>{selectedRecord.remark}</p>
                <p className="mt-2">{t('common.relatedTo', { value: selectedRecord.relatedTo ?? t('common.none') })}</p>
              </div>
            </div>
          ) : (
            <EmptyState eyebrow={t('panelTitle.wallet')} title={t('wallet.emptyTitle')} description={t('wallet.emptyDescription')} />
          )}
        </div>
      </MainPanel>
    </>
  )
}
