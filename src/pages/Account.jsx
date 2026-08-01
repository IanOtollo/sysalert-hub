import { useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { LuUser } from 'react-icons/lu'
import api from '../utils/axios.js'
import { roleLabel } from '../utils/roleLabels.js'

export default function Account() {
  const { user } = useSelector((state) => state.auth)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const update = { fullName, phone }
      if (password) update.password = password
      await api.put(`/users/${user._id}`, update)
      const stored = JSON.parse(localStorage.getItem('sysalert_user'))
      localStorage.setItem('sysalert_user', JSON.stringify({ ...stored, fullName, phone }))
      toast.success('Profile updated — refresh to see changes everywhere')
      setPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="card flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-green text-white">
          <LuUser className="h-8 w-8" />
        </div>
        <div>
          <p className="font-serif text-xl text-brand-brown">{user?.fullName}</p>
          <p className="text-sm text-brand-brown/60">{user?.email}</p>
          <span className="badge mt-1 inline-block bg-brand-cream text-brand-brown/70 border border-brand-border">
            {roleLabel(user?.role)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h3 className="font-serif text-lg text-brand-brown">Edit Profile</h3>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-brown">Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-brown">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-brown">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="input-field"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
