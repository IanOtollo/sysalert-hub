import dbConnect from '../../../lib/dbConnect.js'
import { protect } from '../../../lib/authMiddleware.js'
import Incident from '../../../models/Incident.js'
import createNotification from '../../../lib/createNotification.js'
import logActivity from '../../../lib/logActivity.js'
import canAccessIncident from '../../../lib/incidentAccess.js'

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!['admin', 'teamlead'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: only admins and team leads can change incident status' })
  }

  await dbConnect()
  const { id } = req.query
  const { status } = req.body

  const validStatuses = ['open', 'in-progress', 'resolved', 'closed']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }

  const incident = await Incident.findById(id).populate('project', 'teamLead client')
  if (!incident) return res.status(404).json({ message: 'Incident not found' })
  if (!canAccessIncident(req.user, incident)) {
    return res.status(403).json({ message: 'Forbidden: you do not have access to this incident' })
  }

  incident.status = status
  if (status === 'resolved') incident.resolvedAt = new Date()
  await incident.save()

  await logActivity({
    user: req.user._id,
    action: `Changed incident "${incident.title}" status to ${status}`,
    entity: 'incident',
    entityId: incident._id,
  })

  const receivers = new Set()
  if (incident.reportedBy) receivers.add(incident.reportedBy.toString())

  const project = incident.project
  if (project?.teamLead) receivers.add(project.teamLead.toString())
  if (status === 'resolved' && project?.client) {
    receivers.add(project.client.toString())
  }

  await createNotification({
    sender: req.user._id,
    receiver: Array.from(receivers),
    message:
      status === 'resolved'
        ? `Incident "${incident.title}" has been resolved`
        : `Incident "${incident.title}" status changed to ${status}`,
    type: 'incident',
    referenceId: incident._id,
  })

  return res.status(200).json(incident)
}

export default protect(handler)
