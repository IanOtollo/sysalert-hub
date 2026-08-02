import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import useHideOnScroll from '../hooks/useHideOnScroll.js'
import { selectUnreadCount } from '../features/notifications/notificationsSlice.js'
import {
  LuLayoutDashboard,
  LuFolderKanban,
  LuTriangleAlert,
  LuListChecks,
  LuClipboardList,
  LuBell,
  LuUsers,
  LuScrollText,
  LuChartColumn,
  LuUserRound,
} from 'react-icons/lu'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard, roles: ['admin', 'teamlead', 'developer', 'client'] },
  { to: '/my-tasks', label: 'My Tasks', icon: LuClipboardList, roles: ['developer'] },
  {
    to: '/projects',
    label: 'Projects',
    labelByRole: { client: 'My Projects' },
    icon: LuFolderKanban,
    roles: ['admin', 'teamlead', 'client'],
  },
  { to: '/incidents', label: 'Incidents', icon: LuTriangleAlert, roles: ['admin', 'teamlead', 'developer'] },
  { to: '/tasks', label: 'Tasks', icon: LuListChecks, roles: ['admin', 'teamlead'] },
  { to: '/notifications', label: 'Notifications', icon: LuBell, roles: ['admin', 'teamlead', 'developer', 'client'] },
  { to: '/users', label: 'Users', icon: LuUsers, roles: ['admin'] },
  { to: '/logs', label: 'Activity Logs', icon: LuScrollText, roles: ['admin'] },
  { to: '/reports', label: 'Reports', icon: LuChartColumn, roles: ['admin', 'teamlead'] },
  { to: '/account', label: 'Account', icon: LuUserRound, roles: ['admin', 'teamlead', 'developer', 'client'] },
]

export default function BottomBar() {
  const { user } = useSelector((state) => state.auth)
  const visible = useHideOnScroll()
  const unreadCount = useSelector(selectUnreadCount)
  const items = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role))

  return (
    <nav
      className={`fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-brand-cream/10 bg-brand-brown/95 px-2 py-2 shadow-xl backdrop-blur-md">
        {items.map(({ to, label, labelByRole, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-brand-orange/20 text-brand-orangelight'
                  : 'text-brand-cream/60 hover:bg-brand-cream/10 hover:text-brand-cream'
              }`
            }
          >
            <span className="relative">
              <Icon className="h-4 w-4 shrink-0" />
              {to === '/notifications' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[9px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {labelByRole?.[user?.role] || label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
