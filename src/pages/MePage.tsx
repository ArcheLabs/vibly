import { useEffect, useState } from 'react'
import { CircleUserRound, IdCard, PencilLine, ShieldCheck, SlidersHorizontal, Info } from 'lucide-react'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { PanelTitle } from '@/components/layout/PanelTitle'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { useI18n } from '@/i18n'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import type { MeSection } from '@/types'

const meSections: Array<{ key: MeSection; labelKey: string; icon: typeof CircleUserRound }> = [
  { key: 'profile', labelKey: 'me.profile', icon: CircleUserRound },
  { key: 'identity', labelKey: 'me.identity', icon: IdCard },
  { key: 'preferences', labelKey: 'me.preferences', icon: SlidersHorizontal },
  { key: 'security', labelKey: 'me.security', icon: ShieldCheck },
  { key: 'about', labelKey: 'me.about', icon: Info },
]

export function MePage() {
  const { locale, t } = useI18n()
  const { meSection, setMeSection } = useAppContext()
  const [notice, setNotice] = useState(t('me.noticeDefault'))

  useEffect(() => {
    setNotice(t('me.noticeDefault'))
  }, [locale, t])

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={<PanelTitle icon={CircleUserRound} title={t('panelTitle.me')} />}
      >
        <div>
          {meSections.map((section) => {
            const Icon = section.icon

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setMeSection(section.key)}
                className={cn(
                  'flex w-full items-center gap-2 border-b border-default px-3 py-3 text-sm transition',
                  meSection === section.key ? 'bg-muted text-primary' : 'text-muted hover-bg-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(section.labelKey)}</span>
              </button>
            )
          })}
        </div>
      </ListPanel>
      <MainPanel>
        <div className="p-3">
          {meSection === 'profile' ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {t('me.profileEyebrow')}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-primary">libingjiang</h2>
              <p className="mt-2 max-w-2xl text-sm text-secondary">
                {t('me.profileDescription')}
              </p>
              <Button className="mt-4" variant="accent" onClick={() => setNotice(t('me.noticeNotEditable'))}>
                <PencilLine className="h-4 w-4" />
                {t('actions.editProfile')}
              </Button>
            </div>
          ) : meSection === 'identity' ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">{t('me.identityTitle')}</h2>
              <div className="p-1">
                <p className="text-sm text-secondary">{t('me.account', { value: '5F3sa2TJ...Vibly' })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge label={t('me.defaultIdentity', { value: 'libingjiang' })} variant="default" />
                  <Badge label="Research Assistant" variant="accent" />
                </div>
              </div>
            </div>
          ) : meSection === 'preferences' ? (
            <div>
              <h2 className="text-2xl font-semibold text-primary">{t('me.preferencesTitle')}</h2>
              <p className="mt-2 text-sm text-secondary">{t('me.preferencesDescription')}</p>
            </div>
          ) : meSection === 'security' ? (
            <div>
              <h2 className="text-2xl font-semibold text-primary">{t('me.securityTitle')}</h2>
              <p className="mt-2 text-sm text-secondary">{t('me.securityDescription')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">{t('me.aboutTitle')}</h2>
              <div className="p-1 text-sm text-secondary">
                {t('me.aboutVersion')}
              </div>
              <Divider variant="inset" />
              <div className="p-1 text-sm text-secondary">
                {t('me.aboutDescription')}
              </div>
            </div>
          )}
          <Divider variant="full" className="my-4" />
          <p className="mt-5 text-sm text-muted">{notice}</p>
        </div>
      </MainPanel>
    </>
  )
}
