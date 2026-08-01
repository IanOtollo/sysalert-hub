import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../utils/axios.js'
import Spinner from '../components/Spinner.jsx'
import TaskCard from '../components/TaskCard.jsx'
import Select from '../components/Select.jsx'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
]

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    api
      .get('/tasks/my-tasks')
      .then(({ data }) => setTasks(data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => tasks.filter((t) => statusFilter === 'all' || t.status === statusFilter),
    [tasks, statusFilter]
  )

  async function handleStatusChange(taskId, status) {
    try {
      await api.put(`/tasks/${taskId}/status`, { status })
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)))
      toast.success('Task status updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task')
    }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} className="w-44" />

      {filtered.length === 0 ? (
        <div className="card text-center text-sm text-brand-brown/50">You have no tasks here.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard key={t._id} task={t} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
