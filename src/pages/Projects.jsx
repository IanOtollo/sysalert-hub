import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { LuPlus, LuUsers, LuUser, LuUserPlus } from 'react-icons/lu'
import api from '../utils/axios.js'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import Select from '../components/Select.jsx'
import MultiSelect from '../components/MultiSelect.jsx'

const STATUS_BADGE = {
  active: 'bg-[#DCE4C6] text-[#586B2E]',
  completed: 'bg-brand-cream text-brand-brown/60 border border-brand-border',
  'on-hold': 'bg-[#F0DCC4] text-[#B5651D]',
}

const emptyForm = {
  title: '',
  description: '',
  client: '',
  teamLead: '',
  developers: [],
  status: 'active',
  startDate: '',
  endDate: '',
}

const EMAIL_DOMAIN = '@ika360.com'

const emptyClientForm = { fullName: '', email: '', password: '', phone: '' }

export default function Projects() {
  const { user } = useSelector((state) => state.auth)
  const canCreate = ['admin', 'teamlead'].includes(user?.role)

  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [creatingClient, setCreatingClient] = useState(false)

  async function loadProjects() {
    const { data } = await api.get('/projects')
    setProjects(data)
  }

  useEffect(() => {
    async function load() {
      try {
        const requests = [api.get('/projects')]
        if (canCreate) requests.push(api.get('/users'))
        const [projRes, usersRes] = await Promise.all(requests)
        setProjects(projRes.data)
        if (usersRes) setUsers(usersRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/projects', form)
      toast.success('Project created')
      setModalOpen(false)
      setForm(emptyForm)
      await loadProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClientEmailChange(raw) {
    const local = raw.replace(/[^a-zA-Z0-9._+-]/g, '')
    setClientForm({ ...clientForm, email: local ? `${local}${EMAIL_DOMAIN}` : '' })
  }

  async function handleCreateClient(e) {
    e.preventDefault()
    setCreatingClient(true)
    try {
      const { data } = await api.post('/auth/register', { ...clientForm, role: 'client' })
      setUsers((prev) => [...prev, data])
      setForm((prev) => ({ ...prev, client: data._id }))
      toast.success('Client added')
      setClientModalOpen(false)
      setClientForm(emptyClientForm)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add client')
    } finally {
      setCreatingClient(false)
    }
  }

  const clients = users.filter((u) => u.role === 'client')
  const teamLeads = users.filter((u) => u.role === 'teamlead')
  const developers = users.filter((u) => u.role === 'developer')

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-brown/60">{projects.length} project(s)</p>
        {canCreate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5">
            <LuPlus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center text-sm text-brand-brown/50">No projects yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg text-brand-brown">{p.title}</h3>
                <span className={`badge shrink-0 capitalize ${STATUS_BADGE[p.status]}`}>{p.status}</span>
              </div>
              {p.description && <p className="mt-2 line-clamp-2 text-sm text-brand-brown/60">{p.description}</p>}
              <div className="mt-4 space-y-1.5 text-xs text-brand-brown/50">
                {p.teamLead?.fullName && (
                  <p className="flex items-center gap-1.5">
                    <LuUser className="h-3.5 w-3.5" /> Lead: {p.teamLead.fullName}
                  </p>
                )}
                {p.developers?.length > 0 && (
                  <p className="flex items-center gap-1.5">
                    <LuUsers className="h-3.5 w-3.5" /> {p.developers.length} developer(s)
                  </p>
                )}
                {p.client?.fullName && <p>Client: {p.client.fullName}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal title="New Project" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-brand-brown">Client</label>
                <button
                  type="button"
                  onClick={() => setClientModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-brand-orange hover:underline"
                >
                  <LuUserPlus className="h-3.5 w-3.5" /> Add new
                </button>
              </div>
              <Select
                value={form.client}
                onChange={(v) => setForm({ ...form, client: v })}
                placeholder="Select client"
                options={clients.map((c) => ({ value: c._id, label: c.fullName }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Team Lead</label>
              <Select
                value={form.teamLead}
                onChange={(v) => setForm({ ...form, teamLead: v })}
                placeholder="Select lead"
                options={teamLeads.map((t) => ({ value: t._id, label: t.fullName }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Developers</label>
            <MultiSelect
              value={form.developers}
              onChange={(v) => setForm({ ...form, developers: v })}
              placeholder="Select developers"
              options={developers.map((d) => ({ value: d._id, label: d.fullName }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </Modal>

      <Modal title="Add New Client" open={clientModalOpen} onClose={() => setClientModalOpen(false)}>
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Full Name</label>
            <input
              required
              value={clientForm.fullName}
              onChange={(e) => setClientForm({ ...clientForm, fullName: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Email</label>
            <div className="flex items-stretch overflow-hidden rounded-btn border border-brand-border bg-white focus-within:ring-2 focus-within:ring-brand-orange/40">
              <input
                required
                value={clientForm.email.replace(EMAIL_DOMAIN, '')}
                onChange={(e) => handleClientEmailChange(e.target.value)}
                placeholder="username"
                className="w-full min-w-0 border-0 bg-transparent px-3 py-2 text-sm text-brand-brown placeholder:text-brand-brown/40 focus:outline-none focus:ring-0"
              />
              <span className="flex shrink-0 items-center whitespace-nowrap border-l border-brand-border bg-brand-cream px-3 text-sm text-brand-brown/60">
                {EMAIL_DOMAIN}
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Password</label>
            <input
              type="password"
              required
              value={clientForm.password}
              onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Phone</label>
            <input
              value={clientForm.phone}
              onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              className="input-field"
            />
          </div>
          <button type="submit" disabled={creatingClient} className="btn-primary w-full disabled:opacity-50">
            {creatingClient ? 'Adding...' : 'Add Client'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
