import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ title, subtitle, action, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('nl_sidebar_collapsed') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('nl_sidebar_collapsed', collapsed ? '1' : '0')
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, [collapsed])

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Topbar
          title={title}
          subtitle={subtitle}
          action={action}
          onMenuClick={() => setMenuOpen(true)}
        />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8 space-y-6">{children}</main>
      </div>
    </div>
  )
}
