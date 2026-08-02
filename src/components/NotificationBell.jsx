import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { LuBell } from 'react-icons/lu'
import moment from 'moment'
import { markAsRead, selectUnreadCount } from '../features/notifications/notificationsSlice.js'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const notifications = useSelector((state) => state.notifications.items)
  const unreadCount = useSelector(selectUnreadCount)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 hover:bg-brand-cream transition"
        aria-label="Notifications"
      >
        <LuBell className="h-5 w-5 text-brand-brown" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-cream bg-brand-orange" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-card border border-brand-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
            <span className="font-serif text-sm">Notifications</span>
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs font-medium text-brand-orange hover:underline"
            >
              View all
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-brand-brown/60">No notifications yet.</p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <button
                  key={n._id}
                  onClick={() => dispatch(markAsRead(n._id))}
                  className={`block w-full border-b border-brand-border/60 px-4 py-3 text-left text-sm last:border-0 hover:bg-brand-cream ${
                    n.isRead ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-brand-brown">{n.message}</p>
                  <p className="mt-1 text-xs text-brand-brown/50">{moment(n.createdAt).fromNow()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
