import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { LuPlus } from 'react-icons/lu'
import api from '../utils/axios.js'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import TaskCard from '../components/TaskCard.jsx'
import Select from '../components/Select.jsx'

const emptyForm = { title: '', description: '', project: '', incident: '', assignedTo: '', priority: 'medium', dueDate: '' }

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
]

const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const PRIORITY_OPTIONS = PRIORITY_FILTER_OPTIONS.slice(1)

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [incidents, setIncidents] = useState([])
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  async function loadTasks() {
    const { data } = await api.get('/tasks')
    setTasks(data)
  }

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, projRes, incRes, usersRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/projects'),
          api.get('/incidents'),
          api.get('/users'),
        ])
        setTasks(taskRes.data)
        setProjects(projRes.data)
        setIncidents(incRes.data)
        setDevelopers(usersRes.data.filter((u) => u.role === 'developer'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter])

  async function handleStatusChange(taskId, status) {
    try {
      await api.put(`/tasks/${taskId}/status`, { status })
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/tasks', form)
      toast.success('Task created')
      setModalOpen(false)
      setForm(emptyForm)
      await loadTasks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task')
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
          <Select value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_FILTER_OPTIONS} className="w-44" />
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5 self-start">
          <LuPlus className="h-4 w-4" /> New Task
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-sm text-brand-brown/50">No tasks match these filters.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard key={t._id} task={t} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      <Modal title="New Task" open={modalOpen} onClose={() => setModalOpen(false)}>
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
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Project</label>
              <Select
                value={form.project}
                onChange={(v) => setForm({ ...form, project: v })}
                placeholder="None"
                options={projects.map((p) => ({ value: p._id, label: p.title }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Incident</label>
              <Select
                value={form.incident}
                onChange={(v) => setForm({ ...form, incident: v })}
                placeholder="None"
                options={incidents.map((i) => ({ value: i._id, label: i.title }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Assign To</label>
            <Select
              value={form.assignedTo}
              onChange={(v) => setForm({ ...form, assignedTo: v })}
              placeholder="Select developer"
              options={developers.map((d) => ({ value: d._id, label: d.fullName }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Priority</label>
              <Select
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v })}
                options={PRIORITY_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-brown">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
