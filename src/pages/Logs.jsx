import { useEffect, useState } from 'react'
import moment from 'moment'
import api from '../utils/axios.js'
import Spinner from '../components/Spinner.jsx'
import Select from '../components/Select.jsx'

const ENTITY_OPTIONS = [
  { value: 'all', label: 'All Entities' },
  { value: 'incident', label: 'Incidents' },
  { value: 'task', label: 'Tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'user', label: 'Users' },
  { value: 'notification', label: 'Notifications' },
]

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('all')

  useEffect(() => {
    api
      .get('/logs', { params: entityFilter !== 'all' ? { entity: entityFilter } : {} })
      .then(({ data }) => setLogs(data))
      .finally(() => setLoading(false))
  }, [entityFilter])

  return (
    <div className="space-y-6">
      <Select value={entityFilter} onChange={setEntityFilter} options={ENTITY_OPTIONS} className="w-48" />

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-brand-border text-sm">
            <thead className="bg-brand-cream/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-brand-brown/70">User</th>
                <th className="px-4 py-3 text-left font-medium text-brand-brown/70">Action</th>
                <th className="px-4 py-3 text-left font-medium text-brand-brown/70">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-brand-brown/70">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-brand-brown/50">
                    No activity recorded yet.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-brown">{log.user?.fullName || 'System'}</td>
                  <td className="px-4 py-3 text-brand-brown/70">{log.action}</td>
                  <td className="whitespace-nowrap px-4 py-3 capitalize text-brand-brown/70">{log.entity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-brown/50">
                    {moment(log.createdAt).format('MMM D, YYYY h:mm A')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
