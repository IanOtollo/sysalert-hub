import { Link } from 'react-router-dom'
import moment from 'moment'
import { LuFolderKanban, LuUser } from 'react-icons/lu'
import { PRIORITY_BADGE, INCIDENT_STATUS_BADGE } from '../utils/badges.js'

export default function IncidentCard({ incident }) {
  return (
    <Link to={`/incidents/${incident._id}`} className="card block">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-lg text-brand-brown">{incident.title}</h3>
        <span className={`badge shrink-0 capitalize ${PRIORITY_BADGE[incident.priority]}`}>{incident.priority}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-brand-brown/60">{incident.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-brand-brown/50">
        <span className={`badge capitalize ${INCIDENT_STATUS_BADGE[incident.status]}`}>{incident.status}</span>
        <span className="capitalize">{incident.category}</span>
        {incident.project?.title && (
          <span className="flex items-center gap-1">
            <LuFolderKanban className="h-3.5 w-3.5" /> {incident.project.title}
          </span>
        )}
        {incident.assignedTo?.fullName && (
          <span className="flex items-center gap-1">
            <LuUser className="h-3.5 w-3.5" /> {incident.assignedTo.fullName}
          </span>
        )}
        <span className="ml-auto">{moment(incident.createdAt).fromNow()}</span>
      </div>
    </Link>
  )
}
