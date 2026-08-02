import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet, useLocation, matchPath } from 'react-router-dom'
import BottomBar from './BottomBar.jsx'
import Topbar from './Topbar.jsx'
import { fetchNotifications } from '../features/notifications/notificationsSlice.js'

const NOTIFICATIONS_POLL_MS = 30000

const TITLES = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/projects', title: 'Projects' },
  { path: '/incidents/:id', title: 'Incident Detail' },
  { path: '/incidents', title: 'Incidents' },
  { path: '/tasks', title: 'Tasks' },
  { path: '/my-tasks', title: 'My Tasks' },
  { path: '/notifications', title: 'Notifications' },
  { path: '/users', title: 'Users' },
  { path: '/logs', title: 'Activity Logs' },
  { path: '/reports', title: 'Reports' },
  { path: '/account', title: 'Account' },
]

function getTitle(pathname) {
  const match = TITLES.find((t) => matchPath({ path: t.path, end: true }, pathname))
  return match?.title || 'SysAlert Hub'
}

export default function Layout() {
  const location = useLocation()
  const dispatch = useDispatch()

  // Single shared poll for the whole authenticated app — NotificationBell
  // and BottomBar both read from the store instead of polling separately.
  useEffect(() => {
    dispatch(fetchNotifications())
    const interval = setInterval(() => dispatch(fetchNotifications()), NOTIFICATIONS_POLL_MS)
    return () => clearInterval(interval)
  }, [dispatch])

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <Topbar title={getTitle(location.pathname)} />
      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8">
        <Outlet />
      </main>
      <BottomBar />
    </div>
  )
}
