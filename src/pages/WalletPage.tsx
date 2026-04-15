import {
  CircleCheck,
  Download,
  Fingerprint,
  KeyRound,
  Network,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  TestTube2,
  Wallet,
} from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { PanelTitle } from '@/components/layout/PanelTitle'
import { Badge } from '@/components/ui/Badge'
import { Divider } from '@/components/ui/Divider'
import { useMvpApp } from '@/modules/mvp/provider'
import type { LucideIcon } from 'lucide-react'

const onboardingActions: Array<{
  key: 'extension' | 'seed' | 'json' | 'qr' | 'test'
  label: string
  icon: LucideIcon
}> = [
  { key: 'extension', label: 'Connect Wallet', icon: Wallet },
  { key: 'seed', label: 'Import Seed', icon: KeyRound },
  { key: 'json', label: 'Import JSON', icon: Download },
  { key: 'qr', label: 'Import QR Signer', icon: QrCode },
  { key: 'test', label: 'Create Test Wallet', icon: TestTube2 },
] as const

export function WalletPage() {
  const {
    activeWalletAccount,
    localPrivateState,
    connectExtensionWallet,
    importWallet,
    createTestWallet,
    selectWalletAccount,
    unsupportedNetwork,
    insufficientGas,
  } = useMvpApp()

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={<PanelTitle icon={Wallet} title="Wallet Onboarding" />}
      >
        <div>
          {onboardingActions.map((action) => {
              const Icon = action.icon

              return (
              <button
                key={action.key}
                type="button"
                onClick={() => {
                  if (action.key === 'extension') connectExtensionWallet()
                  if (action.key === 'test') createTestWallet()
                  if (action.key === 'seed' || action.key === 'json' || action.key === 'qr') {
                    importWallet(action.key)
                  }
                }}
                className="flex w-full items-center gap-2 border-b border-default px-3 py-3 text-left text-sm text-muted transition hover-bg-muted hover-text-primary"
              >
                <Icon className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
              )
            })}
        </div>

        <div className="space-y-3 p-3">
          <Divider variant="full" />

          <div className="space-y-2">
            {localPrivateState.wallet.accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => selectWalletAccount(account.id)}
                className="w-full rounded-2xl border border-default bg-surface px-4 py-3 text-left transition hover-bg-muted"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-primary">{account.name}</p>
                    <p className="mt-1 text-xs text-muted">{account.address}</p>
                  </div>
                  {account.id === activeWalletAccount?.id ? <Badge label="Active" variant="accent" /> : null}
                </div>
              </button>
            ))}
          </div>
        </div>
      </ListPanel>

      <MainPanel>
        {activeWalletAccount ? (
          <div className="space-y-4 p-3">
            <div className="rounded-3xl border border-default bg-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Wallet preview</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary">{activeWalletAccount.name}</h2>
                  <p className="mt-2 break-all text-sm text-secondary">{activeWalletAccount.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge label={activeWalletAccount.source} variant="default" />
                  {activeWalletAccount.isTestWallet ? <Badge label="test wallet" variant="warning" /> : null}
                  {activeWalletAccount.isReadOnly ? <Badge label="read only" variant="muted" /> : null}
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-default bg-surface p-3 text-sm text-secondary">
                Vibly keeps wallet data local in this preview. This screen presents signer readiness for identity,
                profile, and agent publishing flows without starting an additional transaction.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Balance</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{activeWalletAccount.balance.toFixed(2)} VIB</p>
                <p className="mt-1 text-xs text-muted">Available for preview actions</p>
              </div>
              <div className="rounded-lg border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Gas</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{activeWalletAccount.gasBalance.toFixed(2)} VIB</p>
                <p className="mt-1 text-xs text-muted">{insufficientGas ? 'Top up before publish flows' : 'Ready for MVP demos'}</p>
              </div>
              <div className="rounded-lg border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Network</p>
                <p className="mt-2 text-lg font-semibold text-primary">{activeWalletAccount.network}</p>
                <p className="mt-1 text-xs text-muted">{unsupportedNetwork ? 'Switch network required' : 'Network matches preview'}</p>
              </div>
              <div className="rounded-lg border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Backup</p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {activeWalletAccount.backedUp ? 'Backed up' : 'Needs backup'}
                </p>
                <p className="mt-1 text-xs text-muted">Required before production use</p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3 rounded-3xl border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Product role</p>
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Wallet account</p>
                    <p className="mt-1 text-sm text-secondary">
                      Signs local preview operations and future chain transactions.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Network className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Root Identity</p>
                    <p className="mt-1 text-sm text-secondary">
                      Becomes the public actor for profile, agents, and relationships.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Readiness</p>
                <div className="flex items-start gap-3">
                  {unsupportedNetwork || insufficientGas || !activeWalletAccount.backedUp ? (
                    <ShieldAlert className="mt-0.5 h-5 w-5 text-warning" />
                  ) : (
                    <CircleCheck className="mt-0.5 h-5 w-5 text-accent" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {unsupportedNetwork || insufficientGas || !activeWalletAccount.backedUp
                        ? 'Review before publish'
                        : 'Ready for preview'}
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      {unsupportedNetwork ? 'Network does not match the configured preview chain. ' : ''}
                      {insufficientGas ? 'Gas is low for publish flows. ' : ''}
                      {!activeWalletAccount.backedUp ? 'Backup has not been confirmed yet. ' : ''}
                      {!unsupportedNetwork && !insufficientGas && activeWalletAccount.backedUp
                        ? 'Network, gas, and backup checks look healthy.'
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-secondary">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted" />
                    <span>Preview mode only</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-muted" />
                    <span>QR signer support planned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted" />
                    <span>Backup/export flow planned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow="Wallet"
            title="No signer selected"
            description="Connect a wallet, import an account, or create a test wallet to start the MVP flow."
          />
        )}
      </MainPanel>
    </>
  )
}
