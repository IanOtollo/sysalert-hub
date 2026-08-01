import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import moment from 'moment'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  LuTriangleAlert,
  LuCircleCheck,
  LuFlame,
  LuListChecks,
  LuFolderKanban,
  LuUsers,
  LuClipboardList,
  LuClock,
  LuPlus,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import api from '../utils/axios.js'
import StatsCard from '../components/StatsCard.jsx'
import Spinner from '../components/Spinner.jsx'
import IncidentCard from '../components/IncidentCard.jsx'
import Modal from '../components/Modal.jsx'
import Select from '../components/Select.jsx'
import TaskCard from '../components/TaskCard.jsx'

const CHART_COLORS = ['#C9762C', '#6E7C4B', '#3B3520', '#7C93B0']

function WelcomeBanner({ name, subtitle }) {
  return (
    <div className="rounded-card bg-brand-gradient p-6 sm:p-8">
      <h2 className="font-serif text-2xl text-brand-brown sm:text-3xl">Welcome back, {name?.split(' ')[0]}</h2>
      <p className="mt-1 text-sm text-brand-brown/70">{subtitle}</p>
    </div>
  )
}

// Shared by Admin (organization-wide) and Team Lead (team-scoped) — the
// underlying API endpoints already scope the data per role, so the same
// layout with different labels/copy is enough to make each feel distinct.
function OpsDashboard({ role }) {
  const isAdmin = role === 'admin'
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState(null)
  const [byStatus, setByStatus] = useState([])
  const [byPriority, setByPriority] = useState([])
  const [byUser, setByUser] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, status, priority, users, act] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/incidents-by-status'),
          api.get('/dashboard/incidents-by-priority'),
          api.get('/dashboard/tasks-by-user'),
          api.get('/dashboard/recent-activity'),
        ])
        setStats(s.data)
        setByStatus(status.data.filter((d) => d.count > 0))
        setByPriority(priority.data)
        setByUser(users.data)
        setActivity(act.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner size="lg" />

  const scope = isAdmin ? 'across the organization' : 'across your team'

  return (
    <div className="space-y-8">
      <WelcomeBanner
        name={user?.fullName}
        subtitle={`Here's what's happening ${scope} today.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard label={isAdmin ? 'Open Incidents' : "Team's Open Incidents"} value={stats.openIncidents} icon={LuTriangleAlert} tone="warning" />
        <StatsCard label="Resolved Incidents" value={stats.resolvedIncidents} icon={LuCircleCheck} tone="success" />
        <StatsCard label="Critical Priority" value={stats.criticalIncidents} icon={LuFlame} tone="warning" />
        <StatsCard label={isAdmin ? 'Pending Tasks' : "Team's Pending Tasks"} value={stats.pendingTasks} icon={LuListChecks} tone="neutral" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2">
        <StatsCard label={isAdmin ? 'Total Projects' : 'Projects You Lead'} value={stats.totalProjects} icon={LuFolderKanban} tone="neutral" />
        {isAdmin && <StatsCard label="Total Users" value={stats.totalUsers} icon={LuUsers} tone="neutral" />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="font-serif text-lg text-brand-brown">Incidents by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="status" outerRadius={90} label>
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-serif text-lg text-brand-brown">Incidents by Priority</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D6" />
              <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#C9762C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-serif text-lg text-brand-brown">{isAdmin ? 'Tasks by Team Member' : "Your Team's Task Load"}</h3>
        {byUser.length === 0 ? (
          <p className="mt-4 text-sm text-brand-brown/50">No tasks assigned yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byUser}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D6" />
              <XAxis dataKey="fullName" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total Tasks" fill="#3B3520" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#6E7C4B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3 className="font-serif text-lg text-brand-brown">{isAdmin ? 'Recent Activity' : "Your Team's Recent Activity"}</h3>
        <div className="mt-4 divide-y divide-brand-border/60">
          {activity.length === 0 && <p className="py-4 text-sm text-brand-brown/50">No recent activity.</p>}
          {activity.map((log) => (
            <div key={log._id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <span className="font-medium text-brand-brown">{log.user?.fullName || 'System'}</span>{' '}
                <span className="text-brand-brown/60">{log.action}</span>
              </div>
              <span className="shrink-0 text-xs text-brand-brown/40">{moment(log.createdAt).fromNow()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeveloperDashboard() {
  const { user } = useSelector((state) => state.auth)
  const [tasks, setTasks] = useState([])
  const [incidentCount, setIncidentCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, incRes] = await Promise.all([api.get('/tasks/my-tasks'), api.get('/incidents')])
        setTasks(taskRes.data)
        setIncidentCount(incRes.data.length)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner size="lg" />

  const pending = tasks.filter((t) => t.status === 'pending').length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const overdue = tasks.filter((t) => t.status === 'overdue').length
  const upcoming = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
    .slice(0, 6)

  return (
    <div className="space-y-8">
      <WelcomeBanner name={user?.fullName} subtitle="Here's what's on your plate today." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard label="Pending Tasks" value={pending} icon={LuClipboardList} tone="neutral" />
        <StatsCard label="In Progress" value={inProgress} icon={LuListChecks} tone="warning" />
        <StatsCard label="Overdue" value={overdue} icon={LuClock} tone="warning" />
        <StatsCard label="My Incidents" value={incidentCount} icon={LuTriangleAlert} tone="neutral" />
      </div>

      <div>
        <h3 className="font-serif text-xl text-brand-brown">My Upcoming Tasks</h3>
        {upcoming.length === 0 ? (
          <div className="card mt-4 text-center text-sm text-brand-brown/50">You're all caught up — no open tasks.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((t) => (
              <TaskCard key={t._id} task={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const emptyFeedbackForm = { title: '', description: '', project: '' }

function ClientDashboard() {
  const { user } = useSelector((state) => state.auth)
  const [projects, setProjects] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyFeedbackForm)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    const [projRes, incRes] = await Promise.all([api.get('/projects'), api.get('/incidents')])
    setProjects(projRes.data)
    setIncidents(incRes.data)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/incidents', { ...form, category: 'general', priority: 'medium' })
      toast.success('Feedback submitted — the project team has been notified')
      setModalOpen(false)
      setForm(emptyFeedbackForm)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner size="lg" />

  const activeProjects = projects.filter((p) => p.status === 'active').length
  const openIncidents = incidents.filter((i) => !['resolved', 'closed'].includes(i.status)).length
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved').length
  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <WelcomeBanner name={user?.fullName} subtitle="Here's the latest on your project progress." />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex shrink-0 items-center gap-1.5 self-start"
        >
          <LuPlus className="h-4 w-4" /> Submit Feedback
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard label="Active Projects" value={activeProjects} icon={LuFolderKanban} tone="neutral" />
        <StatsCard label="Open Incidents" value={openIncidents} icon={LuTriangleAlert} tone="warning" />
        <StatsCard label="Resolved Incidents" value={resolvedIncidents} icon={LuCircleCheck} tone="success" />
        <StatsCard label="Total Projects" value={projects.length} icon={LuFolderKanban} tone="neutral" />
      </div>

      <div>
        <h3 className="font-serif text-xl text-brand-brown">Latest Updates</h3>
        {recentIncidents.length === 0 ? (
          <div className="card mt-4 text-center text-sm text-brand-brown/50">No updates yet on your project.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {recentIncidents.map((i) => (
              <IncidentCard key={i._id} incident={i} />
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-brand-brown/40">
          Have feedback on any of these? Open one and leave a comment — the project team will see it right away.
        </p>
      </div>

      <Modal title="Submit Feedback" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Project</label>
            <Select
              value={form.project}
              onChange={(v) => setForm({ ...form, project: v })}
              placeholder="Select project"
              options={projects.map((p) => ({ value: p._id, label: p.title }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Add export-to-PDF for reports"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-brown">Details</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the feedback or requirement..."
              className="input-field"
              rows={4}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth)

  if (user?.role === 'admin') return <OpsDashboard role="admin" />
  if (user?.role === 'teamlead') return <OpsDashboard role="teamlead" />
  if (user?.role === 'developer') return <DeveloperDashboard />
  if (user?.role === 'client') return <ClientDashboard />
  return null
}
