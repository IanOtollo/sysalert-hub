import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import moment from 'moment'
import { LuArrowLeft, LuPlus } from 'react-icons/lu'
import api from '../utils/axios.js'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import CommentSection from '../components/CommentSection.jsx'
import TaskCard from '../components/TaskCard.jsx'
import Select from '../components/Select.jsx'
import { PRIORITY_BADGE, INCIDENT_STATUS_BADGE } from '../utils/badges.js'

const emptyTaskForm = { title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' }

const INCIDENT_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const canManage = ['admin', 'teamlead'].includes(user?.role)

  const [incident, setIncident] = useState(null)
  const [tasks, setTasks] = useState([])
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyTaskForm)
  const [submitting, setSubmitting] = useState(false)

  async function loadAll() {
    const requests = [api.get(`/incidents/${id}`), api.get('/tasks')]
    if (canManage) requests.push(api.get('/users'))
    const [incRes, taskRes, usersRes] = await Promise.all(requests)
    setIncident(incRes.data)
    setTasks(taskRes.data.filter((t) => t.incident?._id === id || t.incident === id))
    if (usersRes) setDevelopers(usersRes.data.filter((u) => u.role === 'developer'))
  }

  useEffect(() => {
    setLoading(true)
    loadAll().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleStatusChange(status) {
    try {
      const { data } = await api.put(`/incidents/${id}/status`, { status })
      setIncident((prev) => ({ ...prev, status: data.status, resolvedAt: data.resolvedAt }))
      toast.success(`Status updated to ${status}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  async function handleTaskStatusChange(taskId, status) {
    try {
      await api.put(`/tasks/${taskId}/status`, { status })
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task')
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/tasks', { ...form, incident: id, project: incident.project?._id })
      toast.success('Task created')
      setModalOpen(false)
      setForm(emptyTaskForm)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !incident) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/incidents')}
        className="flex items-center gap-1.5 text-sm text-brand-brown/60 hover:text-brand-brown"
      >
        <LuArrowLeft className="h-4 w-4" /> Back to Incidents
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-brand-brown">{incident.title}</h2>
            <p className="mt-2 text-sm text-brand-brown/70">{incident.description}</p>
          </div>
          <span className={`badge shrink-0 capitalize ${PRIORITY_BADGE[incident.priority]}`}>{incident.priority}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-brand-brown/50">
          <span className="capitalize">{incident.category}</span>
          {incident.project?.title && <span>Project: {incident.project.title}</span>}
          {incident.reportedBy?.fullName && <span>Reported by: {incident.reportedBy.fullName}</span>}
          {incident.assignedTo?.fullName && <span>Assigned to: {incident.assignedTo.fullName}</span>}
          <span>{moment(incident.createdAt).format('MMM D, YYYY h:mm A')}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className={`badge capitalize ${INCIDENT_STATUS_BADGE[incident.status]}`}>{incident.status}</span>
          {canManage && (
            <Select
              value={incident.status}
              onChange={handleStatusChange}
              options={INCIDENT_STATUS_OPTIONS}
              className="w-44"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-brand-brown">Linked Tasks</h3>
        {canManage && (
          <button onClick={() => setModalOpen(true)} className="btn-secondary flex items-center gap-1.5">
            <LuPlus className="h-4 w-4" /> Add Task
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="card text-center text-sm text-brand-brown/50">No tasks linked to this incident yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tasks.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              onStatusChange={
                canManage || t.assignedTo?._id === user?._id ? handleTaskStatusChange : undefined
              }
            />
          ))}
        </div>
      )}

      <CommentSection
        incidentId={id}
        comments={incident.comments || []}
        onCommentsChange={(comments) => setIncident((prev) => ({ ...prev, comments }))}
      />

      <Modal title="Add Task" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreateTask} className="space-y-4">
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
