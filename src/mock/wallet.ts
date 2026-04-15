import type { WalletRecord, WalletSummary } from '@/types'

export const walletSummary: WalletSummary = {
  balance: '24.00 VER',
  income30d: '+8.00 VER',
  expense30d: '-1.00 VER',
}

export const walletRecords: WalletRecord[] = [
  {
    id: 'wr1',
    type: 'income',
    title: 'Agent income',
    amount: '+8.00 VER',
    time: 'Today 08:20',
    remark: 'Research Assistant session income',
    relatedTo: 'Research Assistant',
  },
  {
    id: 'wr2',
    type: 'expense',
    title: 'Agent session',
    amount: '-1.00 VER',
    time: 'Yesterday 19:10',
    remark: 'Conversation with Lobster Claw',
    relatedTo: 'Lobster Claw',
  },
]
