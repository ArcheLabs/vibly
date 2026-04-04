import { useEffect, useMemo, useState } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AgentCard } from '@/components/profile/AgentCard'
import { ProfilePanel } from '@/components/profile/ProfilePanel'
import { UserCard } from '@/components/profile/UserCard'
import { LayoutOverlayContext } from '@/components/layout/LayoutOverlayContext'
import { SideNav } from '@/components/layout/SideNav'
import { GlobalBannerStack } from '@/components/system/GlobalBannerStack'
import { NotificationCenter } from '@/components/system/NotificationCenter'
import { IconButton } from '@/components/ui/IconButton'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useI18n } from '@/i18n'
import { useAppContext } from '@/lib/app-context'
import { useMvpApp } from '@/modules/mvp/provider'
import type { AppPage } from '@/types'

const pathToPageMap: Record<string, AppPage> = {
  '/chat': 'chat',
  '/agents': 'agents',
  '/discover': 'discover',
  '/contacts': 'contacts',
  '/wallet': 'wallet',
  '/me': 'me',
}

export function AppShell() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const {
    overlay,
    closeOverlay,
    users,
    agents,
    startChatWithAgent,
    startChatWithUser,
    cycleChatConversationFilter,
  } =
    useAppContext()
  const {
    banners,
    localPrivateState,
    uiState,
    unreadNotificationCount,
    toggleNotificationCenter,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    dismissBanner,
  } = useMvpApp()

  const currentPage = pathToPageMap[location.pathname] ?? 'chat'
  const overlayUser = overlay?.type === 'user' ? users.find((user) => user.id === overlay.id) : null
  const overlayAgent = overlay?.type === 'agent' ? agents.find((agent) => agent.id === overlay.id) : null

  useEffect(() => {
    if (isDesktop) {
      setMobilePanelOpen(false)
    }
  }, [isDesktop])

  useEffect(() => {
    setMobilePanelOpen(false)
  }, [location.pathname])

  const layoutOverlayValue = useMemo(
    () => ({
      isMobile: !isDesktop,
      mobilePanelOpen,
      togglePanel: () => setMobilePanelOpen((open) => !open),
      closePanel: () => setMobilePanelOpen(false),
    }),
    [isDesktop, mobilePanelOpen],
  )

  const handleSideNavSelect = (page: AppPage, isActive: boolean) => {
    if (page === 'chat' && isActive) {
      cycleChatConversationFilter()
      return
    }
    navigate(`/${page}`)
  }

  return (
    <LayoutOverlayContext.Provider value={layoutOverlayValue}>
      <div className="relative flex min-h-screen bg-app text-primary">
        <GlobalBannerStack banners={banners} onDismiss={dismissBanner} />
        <NotificationCenter
          open={uiState.notificationCenterOpen}
          notifications={localPrivateState.notifications}
          unreadCount={unreadNotificationCount}
          onToggle={toggleNotificationCenter}
          onMarkRead={markNotificationAsRead}
          onMarkAllRead={markAllNotificationsAsRead}
          onDismiss={dismissNotification}
        />
        <div className="relative flex min-h-screen w-full overflow-hidden border border-default bg-panel">
          {isDesktop ? <SideNav activePage={currentPage} onSelect={handleSideNavSelect} /> : null}
          {!isDesktop ? (
            <div className="absolute left-3 top-3 z-50 flex items-center gap-2">
              <IconButton onClick={layoutOverlayValue.togglePanel} aria-label={t('actions.togglePanel')}>
                <PanelLeftOpen className="h-5 w-5" />
              </IconButton>
            </div>
          ) : null}
          {!isDesktop && mobilePanelOpen ? (
            <>
              <button
                type="button"
                className="absolute inset-0 z-20 bg-black/30"
                onClick={layoutOverlayValue.closePanel}
                aria-label={t('actions.closeListPanel')}
              />
              <div className="absolute inset-y-0 left-0 z-30">
                <SideNav
                  activePage={currentPage}
                  onSelect={(page, isActive) => {
                    handleSideNavSelect(page, isActive)
                    layoutOverlayValue.closePanel()
                  }}
                />
              </div>
            </>
          ) : null}
          <div className="flex min-w-0 flex-1 bg-surface pt-14 lg:pt-0">
            <Outlet />
          </div>
          {overlay ? (
            <>
              <button
                type="button"
                onClick={closeOverlay}
                className="absolute inset-0 bg-black/25"
                aria-label={t('actions.closeProfileOverlay')}
              />
              {overlayUser ? (
                <ProfilePanel title={t('profile.userInfo')} onClose={closeOverlay}>
                  <UserCard
                    user={overlayUser}
                    agents={agents.filter((agent) => overlayUser.publicAgentIds.includes(agent.id))}
                    onMessage={() => {
                      startChatWithUser(overlayUser.id)
                      closeOverlay()
                    }}
                  />
                </ProfilePanel>
              ) : null}
              {overlayAgent ? (
                <ProfilePanel title={t('profile.agentInfo')} onClose={closeOverlay}>
                  <AgentCard
                    agent={overlayAgent}
                    onStartChat={() => {
                      startChatWithAgent(overlayAgent.id)
                      closeOverlay()
                    }}
                  />
                </ProfilePanel>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </LayoutOverlayContext.Provider>
  )
}
