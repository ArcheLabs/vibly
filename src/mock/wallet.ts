import type { WalletRecord, WalletSummary } from '@/types'

export const walletSummary: WalletSummary = {
  balance: '128.50 VER',
  income30d: '+32.00 VER',
  expense30d: '-12.50 VER',
}

export const walletRecords: WalletRecord[] = [
  {
    id: 'wr1',
    type: 'income',
    title: '智能体收入',
    amount: '+8.00 VER',
    time: '今天 08:20',
    remark: 'Research Assistant 会话收入',
    relatedTo: 'Research Assistant',
  },
  {
    id: 'wr2',
    type: 'expense',
    title: '智能体会话支出',
    amount: '-1.00 VER',
    time: '昨天 19:10',
    remark: '与 Lobster Claw 会话',
    relatedTo: 'Lobster Claw',
  },
  {
    id: 'wr3',
    type: 'income',
    title: '联系人协作分成',
    amount: '+24.00 VER',
    time: '周一 14:35',
    remark: '多智能体协作奖励',
    relatedTo: 'Chain Helper',
  },
]
