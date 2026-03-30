import type { WalletSummary as WalletSummaryType } from '@/types'

type WalletSummaryProps = {
  summary: WalletSummaryType
}

export function WalletSummary({ summary }: WalletSummaryProps) {
  return (
    <div className="app-card p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">Balance</p>
      <h2 className="mt-2 text-3xl font-semibold text-primary">{summary.balance}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="app-subcard p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">30d Income</p>
          <p className="mt-1 text-lg font-semibold text-primary">{summary.income30d}</p>
        </div>
        <div className="app-subcard p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">30d Expense</p>
          <p className="mt-1 text-lg font-semibold text-primary">{summary.expense30d}</p>
        </div>
      </div>
    </div>
  )
}
