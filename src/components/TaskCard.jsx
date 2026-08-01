import moment from 'moment'
import { LuFolderKanban, LuUser, LuCalendar } from 'react-icons/lu'
import { PRIORITY_BADGE, TASK_STATUS_BADGE } from '../utils/badges.js'
import Select from './Select.jsx'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
]

export default function TaskCard({ task, onStatusChange }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-lg text-brand-brown">{task.title}</h3>
        <span className={`badge shrink-0 capitalize ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
      </div>
      {task.description && <p className="mt-2 line-clamp-2 text-sm text-brand-brown/60">{task.description}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-brand-brown/50">
        {task.project?.title && (
          <span className="flex items-center gap-1">
            <LuFolderKanban className="h-3.5 w-3.5" /> {task.project.title}
          </span>
        )}
        {task.assignedTo?.fullName && (
          <span className="flex items-center gap-1">
            <LuUser className="h-3.5 w-3.5" /> {task.assignedTo.fullName}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <LuCalendar className="h-3.5 w-3.5" /> {moment(task.dueDate).format('MMM D, YYYY')}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={`badge capitalize ${TASK_STATUS_BADGE[task.status]}`}>{task.status}</span>
        {onStatusChange && (
          <Select
            value={task.status}
            onChange={(v) => onStatusChange(task._id, v)}
            options={STATUS_OPTIONS}
            className="w-36"
          />
        )}
      </div>
    </div>
  )
}
