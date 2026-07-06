import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/orders', label: 'Orders', icon: '🧾' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/services', label: 'Services', icon: '🧺' },
  { to: '/invoices', label: 'Invoices', icon: '📄' },
  { to: '/delivery', label: 'Delivery', icon: '🚚' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/expenses', label: 'Expenses', icon: '💳' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/staff', label: 'Staff', icon: '🧑\u200d🤝\u200d🧑' },
  { to: '/settings', label: 'Settings', icon: '⚙️' }
]

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:relative z-40 top-0 left-0 h-screen flex-shrink-0 bg-brand-700 text-white flex flex-col transition-all duration-200
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'lg:w-[76px]' : 'w-64'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className={`px-6 pt-8 pb-6 border-b border-white/10 ${collapsed ? 'lg:px-0 lg:text-center' : ''}`}>
            {collapsed ? (
              <h1 className="hidden lg:block text-2xl font-extrabold tracking-tight">NL</h1>
            ) : null}
            <div className={collapsed ? 'lg:hidden' : ''}>
              <h1 className="text-2xl font-extrabold tracking-tight">New Life</h1>
              <p className="text-[11px] uppercase tracking-wider text-brand-100/80 mt-1">
                Dyers &amp; Dry Cleaners
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    collapsed ? 'lg:justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-white text-brand-700'
                      : 'text-white/85 hover:bg-white/10'
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={`m-3 rounded-xl bg-white/10 p-4 text-xs ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="font-semibold mb-1">Free Home Pickup &amp; Delivery</p>
            <p className="text-white/70">Schedule pickups straight from Orders.</p>
          </div>
        </div>

        {/* Desktop collapse/hide toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute top-8 -right-3 w-6 h-6 rounded-full bg-white text-brand-700 border border-gray-200 shadow items-center justify-center text-xs font-bold hover:bg-brand-50"
        >
          {collapsed ? '›' : '‹'}
        </button>
      </aside>
    </>
  )
}
