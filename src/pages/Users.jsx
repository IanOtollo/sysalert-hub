import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { LuPlus, LuPencil, LuTrash2 } from 'react-icons/lu'
import api from '../utils/axios.js'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import Select from '../components/Select.jsx'
import { ROLE_LABELS, roleLabel } from '../utils/roleLabels.js'

const emptyForm = { fullName: '', email: '', password: '', phone: '', role: 'developer' }

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

const EMAIL_DOMAIN = '@ika360.com'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  async function loadUsers() {
    const { data } = await api.get('/users')
    setUsers(data)
  }

  useEffect(() => {
    loadUsers().finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function handleEmailLocalChange(raw) {
    const local = raw.replace(/[^a-zA-Z0-9._+-]/g, '')
    setForm({ ...form, email: local ? `${local}${EMAIL_DOMAIN}` : '' })
  }

  function openEdit(u) {
    setEditingId(u._id)
    setForm({ fullName: u.fullName, email: u.email, password: '', phone: u.phone || '', role: u.role })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        const { email, ...update } = form
        await api.put(`/users/${editingId}`, update)
        toast.success('User updated')
      } else {
        await api.post('/auth/register', form)
        toast.success('User created')
      }
      setModalOpen(false)
      await loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(u) {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive })
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isActive: !x.isActive } : x)))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/users/${id}`)
      setUsers((prev) => prev.filter((u) => u._id !== id))
      toast.success('User deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-brown/60">{users.length} user(s)</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
          <LuPlus className="h-4 w-4" /> New User
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-brand-border text-sm">
          <thead className="bg-brand-cream/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-brand-brown/70">Name</th>
              <th className="px-4 py-3 text-left font-medium text-brand-brown/70">Email</th>
              <th className="px-4 py-3 text-left font-medium text-brand-brown/70">Role</th>
              <th className="px-4 py-3 text-left font-medium text-brand-brown/70">Status</th>
              <th className="px-4 py-3 text-right font-medium text-brand-brown/70">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/60">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="whitespace-nowrap px-4 py-3 text-brand-brown">{u.fullName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-brand-brown/70">{u.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-brand-brown/70">{roleLabel(u.role)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`badge ${
                      u.isActive ? 'bg-[#DCE4C6] text-[#586B2E]' : 'bg-brand-cream text-brand-brown/50 border border-brand-border'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button onClick={() => openEdit(u)} className="rounded-btn p-1.5 text-brand-brown/60 hover:bg-brand-cream">
                    <LuPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="rounded-btn p-1.5 text-brand-orange hover:bg-brand-cream"
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title={editingId ? 'Edit User' : 'New User'} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Full Name</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Email</label>
            {editingId ? (
              <input type="email" disabled value={form.email} className="input-field disabled:opacity-50" />
            ) : (
              <div className="flex items-stretch overflow-hidden rounded-btn border border-brand-border bg-white focus-within:ring-2 focus-within:ring-brand-orange/40">
                <input
                  required
                  value={form.email.replace(EMAIL_DOMAIN, '')}
                  onChange={(e) => handleEmailLocalChange(e.target.value)}
                  placeholder="username"
                  className="w-full min-w-0 border-0 bg-transparent px-3 py-2 text-sm text-brand-brown placeholder:text-brand-brown/40 focus:outline-none focus:ring-0"
                />
                <span className="flex shrink-0 items-center whitespace-nowrap border-l border-brand-border bg-brand-cream px-3 text-sm text-brand-brown/60">
                  {EMAIL_DOMAIN}
                </span>
              </div>
            )}
          </div>
          {!editingId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Role</label>
              <Select value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLE_OPTIONS} />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create User'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
