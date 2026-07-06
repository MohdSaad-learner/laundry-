import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Topbar({ title, subtitle, onMenuClick, action }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const initial = (user?.email || 'A')[0].toUpperCase()

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="lg:hidden text-gray-600 text-xl leading-none"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {action}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold"
          >
            {initial}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 text-sm">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="font-medium text-gray-800 truncate">{user?.email}</p>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
              <button
                onClick={signOut}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
