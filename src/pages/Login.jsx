import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { LuTriangleAlert, LuEye, LuEyeOff } from 'react-icons/lu'
import { login, reset } from '../features/auth/authSlice.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isLoading, isError, message } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isError && message) toast.error(message)
    if (user) navigate('/dashboard')
    return () => dispatch(reset())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isError, message])

  function handleSubmit(e) {
    e.preventDefault()
    dispatch(login({ email, password }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="KaziLink" className="h-14 w-auto" />
          <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-brown/60">
            <LuTriangleAlert className="h-4 w-4 text-brand-orange" /> Incident & Task Management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 bg-white/90">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@kazilink.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-brown/40"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brand-brown/50">
          &copy; {new Date().getFullYear()} KaziLink Incident &amp; Task Management
        </p>
      </div>
    </div>
  )
}
