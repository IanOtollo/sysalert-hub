import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { LuPlus } from 'react-icons/lu'
import api from '../utils/axios.js'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import IncidentCard from '../components/IncidentCard.jsx'
import Select from '../components/Select.jsx'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'bug', label: 'Bug' },
  { value: 'outage', label: 'Outage' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'general', label: 'General' },
]

const FORM_PRIORITY_OPTIONS = PRIORITY_OPTIONS.slice(1)
const FORM_CATEGORY_OPTIONS = CATEGORY_OPTIONS.slice(1)

const emptyForm = {
  title: '',
  description: '',
  project: '',
  category: 'general',
  priority: 'medium',
  assignedTo: '',
}

export default function Incidents() {
  const { user } = useSelector((state) => state.auth)
  const canCreate = ['admin', 'teamlead'].includes(user?.role)

  const [incidents, setIncidents] = useState([])
  const [projects, setProjects] = useState([])
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  async function loadIncidents() {
    const { data } = await api.get('/incidents')
    setIncidents(data)
  }

  useEffect(() => {
    async function load() {
      try {
        const requests = [api.get('/incidents')]
        if (canCreate) requests.push(api.get('/projects'), api.get('/users'))
        const [incRes, projRes, usersRes] = await Promise.all(requests)
        setIncidents(incRes.data)
        if (projRes) setProjects(projRes.data)
        if (usersRes) setDevelopers(usersRes.data.filter((u) => u.role === 'developer'))
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false
      if (priorityFilter !== 'all' && i.priority !== priorityFilter) return false
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false
      return true
    })
  }, [incidents, statusFilter, priorityFilter, categoryFilter])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/incidents', form)
      toast.success('Incident reported')
      setModalOpen(false)
      setForm(emptyForm)
      await loadIncidents()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report incident')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} className="w-44" />
          <Select value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_OPTIONS} className="w-44" />
          <Select value={categoryFilter} onChange={setCategoryFilter} options={CATEGORY_OPTIONS} className="w-44" />
        </div>
        {canCreate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5 self-start">
            <LuPlus className="h-4 w-4" /> Report Incident
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-sm text-brand-brown/50">No incidents match these filters.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((i) => (
            <IncidentCard key={i._id} incident={i} />
          ))}
        </div>
      )}

      <Modal title="Report Incident" open={modalOpen} onClose={() => setModalOpen(false)}>
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
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Project</label>
            <Select
              value={form.project}
              onChange={(v) => setForm({ ...form, project: v })}
              placeholder="Select project"
              options={projects.map((p) => ({ value: p._id, label: p.title }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Category</label>
              <Select
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                options={FORM_CATEGORY_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Priority</label>
              <Select
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v })}
                options={FORM_PRIORITY_OPTIONS}
              />
            </div>
          </div>
          {canCreate && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Assign To</label>
              <Select
                value={form.assignedTo}
                onChange={(v) => setForm({ ...form, assignedTo: v })}
                placeholder="Unassigned"
                options={developers.map((d) => ({ value: d._id, label: d.fullName }))}
              />
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Report Incident'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
