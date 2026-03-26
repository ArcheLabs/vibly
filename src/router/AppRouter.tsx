import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AgentsPage } from '@/pages/AgentsPage'
import { ChatPage } from '@/pages/ChatPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { MePage } from '@/pages/MePage'
import { WalletPage } from '@/pages/WalletPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="me" element={<MePage />} />
      </Route>
    </Routes>
  )
}
