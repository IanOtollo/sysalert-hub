import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { toast } from 'react-toastify'
import { LuCheck, LuTrash2, LuCheckCheck } from 'react-icons/lu'
import Spinner from '../components/Spinner.jsx'
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  selectUnreadCount,
} from '../features/notifications/notificationsSlice.js'

export default function Notifications() {
  const dispatch = useDispatch()
  const notifications = useSelector((state) => state.notifications.items)
  const loaded = useSelector((state) => state.notifications.loaded)
  const unreadCount = useSelector(selectUnreadCount)

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  async function handleMarkAllRead() {
    await dispatch(markAllAsRead())
    toast.success('All notifications marked as read')
  }

  if (!loaded) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-brown/60">{unreadCount} unread</p>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-1.5">
            <LuCheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center text-sm text-brand-brown/50">You have no notifications.</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`card flex items-start justify-between gap-4 ${n.isRead ? 'opacity-60' : ''}`}
            >
              <div>
                <span className="badge mb-1.5 capitalize bg-brand-cream text-brand-brown/70 border border-brand-border">
                  {n.type}
                </span>
                <p className="text-sm text-brand-brown">{n.message}</p>
                <p className="mt-1 text-xs text-brand-brown/40">{moment(n.createdAt).fromNow()}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!n.isRead && (
                  <button
                    onClick={() => dispatch(markAsRead(n._id))}
                    className="rounded-btn p-2 text-brand-green hover:bg-brand-cream"
                    aria-label="Mark as read"
                  >
                    <LuCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => dispatch(deleteNotification(n._id))}
                  className="rounded-btn p-2 text-brand-orange hover:bg-brand-cream"
                  aria-label="Delete notification"
                >
                  <LuTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
