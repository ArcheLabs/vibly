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
        'w-full rounded-[24px] border p-4 text-left transition',
        active ? 'border-stone-900 bg-stone-900 text-white' : 'border-transparent bg-white/80 hover:bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{record.title}</p>
          <p className={cn('mt-1 text-xs', active ? 'text-white/70' : 'text-stone-500')}>{record.remark}</p>
        </div>
        <div className={cn('text-sm font-semibold', record.type === 'income' ? 'text-emerald-500' : 'text-coral')}>
          {record.amount}
        </div>
      </div>
      <p className={cn('mt-3 text-xs', active ? 'text-white/70' : 'text-stone-400')}>{record.time}</p>
    </button>
  )
}
