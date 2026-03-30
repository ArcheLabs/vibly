import { useEffect, useMemo, useState } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AgentCard } from '@/components/profile/AgentCard'
import { ProfilePanel } from '@/components/profile/ProfilePanel'
import { UserCard } from '@/components/profile/UserCard'
import { LayoutOverlayContext } from '@/components/layout/LayoutOverlayContext'
import { SideNav } from '@/components/layout/SideNav'
import { IconButton } from '@/components/ui/IconButton'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useAppContext } from '@/lib/app-context'
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
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const { overlay, closeOverlay, users, agents, startChatWithAgent, startChatWithUser } =
    useAppContext()

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

  return (
    <LayoutOverlayContext.Provider value={layoutOverlayValue}>
      <div className="relative flex min-h-screen bg-app text-primary">
        <div className="relative flex min-h-screen w-full overflow-hidden border border-default bg-panel">
          {isDesktop ? <SideNav activePage={currentPage} onSelect={(page) => navigate(`/${page}`)} /> : null}
          {!isDesktop ? (
            <div className="absolute left-3 top-3 z-50 flex items-center gap-2">
              <IconButton onClick={layoutOverlayValue.togglePanel} aria-label="切换列表区">
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
                aria-label="关闭列表区"
              />
              <div className="absolute inset-y-0 left-0 z-30">
                <SideNav
                  activePage={currentPage}
                  onSelect={(page) => {
                    navigate(`/${page}`)
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
                aria-label="close profile overlay"
              />
              {overlayUser ? (
                <ProfilePanel title="用户信息" onClose={closeOverlay}>
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
                <ProfilePanel title="智能体信息" onClose={closeOverlay}>
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
