import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { LuDownload } from 'react-icons/lu'
import api from '../utils/axios.js'
import Spinner from '../components/Spinner.jsx'

const CHART_COLORS = ['#C9762C', '#6E7C4B', '#3B3520', '#7C93B0']

function toCsv(rows, columns) {
  const header = columns.map((c) => c.label).join(',')
  const body = rows
    .map((row) => columns.map((c) => `"${String(c.value(row) ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  return `${header}\n${body}`
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [byStatus, setByStatus] = useState([])
  const [byPriority, setByPriority] = useState([])
  const [byUser, setByUser] = useState([])
  const [incidents, setIncidents] = useState([])
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [status, priority, users, incRes, taskRes] = await Promise.all([
          api.get('/dashboard/incidents-by-status'),
          api.get('/dashboard/incidents-by-priority'),
          api.get('/dashboard/tasks-by-user'),
          api.get('/incidents'),
          api.get('/tasks'),
        ])
        setByStatus(status.data.filter((d) => d.count > 0))
        setByPriority(priority.data)
        setByUser(users.data)
        setIncidents(incRes.data)
        setTasks(taskRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function exportIncidents() {
    const csv = toCsv(incidents, [
      { label: 'Title', value: (i) => i.title },
      { label: 'Status', value: (i) => i.status },
      { label: 'Priority', value: (i) => i.priority },
      { label: 'Category', value: (i) => i.category },
      { label: 'Project', value: (i) => i.project?.title },
      { label: 'Assigned To', value: (i) => i.assignedTo?.fullName },
      { label: 'Created', value: (i) => new Date(i.createdAt).toLocaleDateString() },
    ])
    downloadCsv('incidents-report.csv', csv)
  }

  function exportTasks() {
    const csv = toCsv(tasks, [
      { label: 'Title', value: (t) => t.title },
      { label: 'Status', value: (t) => t.status },
      { label: 'Priority', value: (t) => t.priority },
      { label: 'Assigned To', value: (t) => t.assignedTo?.fullName },
      { label: 'Due Date', value: (t) => (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '') },
    ])
    downloadCsv('tasks-report.csv', csv)
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <button onClick={exportIncidents} className="btn-secondary flex items-center gap-1.5">
          <LuDownload className="h-4 w-4" /> Export Incidents CSV
        </button>
        <button onClick={exportTasks} className="btn-secondary flex items-center gap-1.5">
          <LuDownload className="h-4 w-4" /> Export Tasks CSV
        </button>
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
        <h3 className="font-serif text-lg text-brand-brown">Tasks by Team Member</h3>
        <ResponsiveContainer width="100%" height={320}>
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
      </div>
    </div>
  )
}
