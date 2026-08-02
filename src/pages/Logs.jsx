import { useEffect, useState } from 'react'
import moment from 'moment'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
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

const PAGE_SIZE = 20

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: PAGE_SIZE }
    if (entityFilter !== 'all') params.entity = entityFilter

    api
      .get('/logs', { params })
      .then(({ data }) => {
        setLogs(data.logs)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      })
      .finally(() => setLoading(false))
  }, [entityFilter, page])

  function handleEntityChange(value) {
    setEntityFilter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={entityFilter} onChange={handleEntityChange} options={ENTITY_OPTIONS} className="w-48" />
        {!loading && <p className="text-sm text-brand-brown/50">{total} total entries</p>}
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="btn-secondary flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <LuChevronLeft className="h-4 w-4" /> Previous
              </button>
              <p className="text-sm text-brand-brown/60">
                Page {page} of {totalPages}
              </p>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="btn-secondary flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <LuChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
