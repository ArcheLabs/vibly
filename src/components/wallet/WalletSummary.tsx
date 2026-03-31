import { useI18n } from '@/i18n'
import { formatAmountByLocale } from '@/i18n/format'
import type { WalletSummary as WalletSummaryType } from '@/types'

type WalletSummaryProps = {
  summary: WalletSummaryType
}

export function WalletSummary({ summary }: WalletSummaryProps) {
  const { locale, t } = useI18n()

  return (
    <div className="app-card p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{t('wallet.balance')}</p>
      <h2 className="mt-2 text-3xl font-semibold text-primary">{formatAmountByLocale(summary.balance, locale)}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="app-subcard p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{t('wallet.income30d')}</p>
          <p className="mt-1 text-lg font-semibold text-primary">{formatAmountByLocale(summary.income30d, locale)}</p>
        </div>
        <div className="app-subcard p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{t('wallet.expense30d')}</p>
          <p className="mt-1 text-lg font-semibold text-primary">{formatAmountByLocale(summary.expense30d, locale)}</p>
        </div>
      </div>
    </div>
  )
}
