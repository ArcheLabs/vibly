import { Download, Fingerprint, QrCode, ShieldAlert, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { PanelTitle } from '@/components/layout/PanelTitle'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { useMvpApp } from '@/modules/mvp/provider'

const onboardingActions = [
  { key: 'extension', label: 'Connect Wallet', detail: 'Detect web extension wallets.' },
  { key: 'seed', label: 'Import Seed', detail: 'Desktop-first local signer import.' },
  { key: 'json', label: 'Import JSON', detail: 'Recover from exported account file.' },
  { key: 'qr', label: 'Import QR Signer', detail: 'Pair a read-only or mobile signer.' },
  { key: 'test', label: 'Create Test Wallet', detail: 'Unsafe localnet-only account.' },
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
        <div className="space-y-3 p-3">
          <div className="space-y-2">
            {onboardingActions.map((action) => (
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
                className="w-full rounded-2xl border border-default bg-surface px-4 py-3 text-left transition hover-bg-muted"
              >
                <p className="text-sm font-semibold text-primary">{action.label}</p>
                <p className="mt-1 text-xs text-muted">{action.detail}</p>
              </button>
            ))}
          </div>

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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Current signer</p>
                <h2 className="mt-2 text-2xl font-semibold text-primary">{activeWalletAccount.name}</h2>
                <p className="mt-2 text-sm text-secondary">{activeWalletAccount.address}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge label={activeWalletAccount.source} variant="default" />
                {activeWalletAccount.isTestWallet ? <Badge label="test wallet" variant="warning" /> : null}
                {activeWalletAccount.isReadOnly ? <Badge label="read only" variant="muted" /> : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Balance</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{activeWalletAccount.balance.toFixed(2)} VER</p>
              </div>
              <div className="rounded-3xl border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Gas</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{activeWalletAccount.gasBalance.toFixed(2)} VER</p>
              </div>
              <div className="rounded-3xl border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Network</p>
                <p className="mt-2 text-lg font-semibold text-primary">{activeWalletAccount.network}</p>
              </div>
              <div className="rounded-3xl border border-default bg-panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Backup</p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {activeWalletAccount.backedUp ? 'Backed up' : 'Needs backup'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-3xl border border-default bg-panel p-4">
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Wallet account vs Root Identity</p>
                    <p className="mt-1 text-sm text-secondary">
                      The wallet signs transactions; the Root Identity becomes the canonical actor on-chain.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-default bg-panel p-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Readiness checks</p>
                    <p className="mt-1 text-sm text-secondary">
                      {unsupportedNetwork ? 'Unsupported network detected.' : 'Network matches localnet.'}{' '}
                      {insufficientGas ? 'Gas is low for publish flows.' : 'Gas looks healthy for MVP demos.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Export / backup
              </Button>
              <Button variant="outline">
                <QrCode className="h-4 w-4" />
                Pair QR signer
              </Button>
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
