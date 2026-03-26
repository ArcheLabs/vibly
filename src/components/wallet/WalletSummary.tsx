import type { WalletSummary as WalletSummaryType } from '@/types'

type WalletSummaryProps = {
  summary: WalletSummaryType
}

export function WalletSummary({ summary }: WalletSummaryProps) {
  return (
    <div className="rounded-[32px] bg-stone-900 p-6 text-white shadow-panel">
      <p className="text-sm uppercase tracking-[0.22em] text-white/60">Balance</p>
      <h2 className="mt-3 font-display text-4xl font-semibold">{summary.balance}</h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-[24px] bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">30d Income</p>
          <p className="mt-2 text-xl font-semibold">{summary.income30d}</p>
        </div>
        <div className="rounded-[24px] bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">30d Expense</p>
          <p className="mt-2 text-xl font-semibold">{summary.expense30d}</p>
        </div>
      </div>
    </div>
  )
}
