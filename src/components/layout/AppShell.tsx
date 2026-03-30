import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AgentCard } from '@/components/profile/AgentCard'
import { ProfilePanel } from '@/components/profile/ProfilePanel'
import { UserCard } from '@/components/profile/UserCard'
import { SideNav } from '@/components/layout/SideNav'
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
  const { overlay, closeOverlay, users, agents, startChatWithAgent, startChatWithUser } =
    useAppContext()

  const currentPage = pathToPageMap[location.pathname] ?? 'chat'
  const overlayUser = overlay?.type === 'user' ? users.find((user) => user.id === overlay.id) : null
  const overlayAgent = overlay?.type === 'agent' ? agents.find((agent) => agent.id === overlay.id) : null

  return (
    <div className="relative flex min-h-screen bg-app text-primary">
      <div className="relative flex min-h-screen w-full overflow-hidden border border-default bg-panel">
        <SideNav activePage={currentPage} onSelect={(page) => navigate(`/${page}`)} />
        <div className="flex min-w-0 flex-1 bg-surface">
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
  )
}
