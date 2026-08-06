import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { LuUser, LuLogOut, LuChevronDown } from 'react-icons/lu'
import { logout } from '../features/auth/authSlice.js'
import { roleLabel } from '../utils/roleLabels.js'
import NotificationBell from './NotificationBell.jsx'

export default function Topbar() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-border/60 bg-brand-cream/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="KaziLink" className="h-8 w-auto" />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationBell />
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-btn py-1 pl-1 pr-2 hover:bg-brand-border/30"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green text-white">
              <LuUser className="h-5 w-5" />
            </div>
            <div className="hidden text-left text-sm leading-tight sm:block">
              <p className="font-medium text-brand-brown">{user?.fullName}</p>
              <p className="text-xs text-brand-brown/50">{roleLabel(user?.role)}</p>
            </div>
            <LuChevronDown className={`hidden h-4 w-4 text-brand-brown/40 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 rounded-card border border-brand-border bg-white py-1 shadow-lg">
              <div className="border-b border-brand-border px-4 py-2.5 sm:hidden">
                <p className="text-sm font-medium text-brand-brown">{user?.fullName}</p>
                <p className="text-xs text-brand-brown/50">{roleLabel(user?.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-brand-brown hover:bg-brand-cream"
              >
                <LuLogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
