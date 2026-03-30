import { cn } from '@/lib/utils'
import type { WalletRecord } from '@/types'

type WalletRecordItemProps = {
  record: WalletRecord
  active: boolean
  onClick: () => void
}

export function WalletRecordItem({ record, active, onClick }: WalletRecordItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full border-b border-default bg-surface px-3 py-3 text-left transition',
        active ? 'bg-muted' : 'hover-bg-muted',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">{record.title}</p>
          <p className="mt-1 text-xs text-muted">{record.remark}</p>
        </div>
        <div className={cn('text-sm font-semibold', record.type === 'income' ? 'text-accent' : 'text-secondary')}>
          {record.amount}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">{record.time}</p>
    </button>
  )
}
