import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Incident from '../../models/Incident.js'
import logActivity from '../../lib/logActivity.js'
import canAccessIncident from '../../lib/incidentAccess.js'

async function handler(req, res) {
  await dbConnect()
  const { id } = req.query

  if (req.method === 'GET') {
    const incident = await Incident.findById(id)
      .populate('project', 'title teamLead client')
      .populate('reportedBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .populate('comments.user', 'fullName email')
    if (!incident) return res.status(404).json({ message: 'Incident not found' })
    if (!canAccessIncident(req.user, incident)) {
      return res.status(403).json({ message: 'Forbidden: you do not have access to this incident' })
    }
    return res.status(200).json(incident)
  }

  if (req.method === 'PUT') {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: only admins and team leads can edit incidents' })
    }

    const existing = await Incident.findById(id).populate('project', 'teamLead')
    if (!existing) return res.status(404).json({ message: 'Incident not found' })
    if (!canAccessIncident(req.user, existing)) {
      return res.status(403).json({ message: 'Forbidden: you do not have access to this incident' })
    }

    const { title, description, project, category, priority, assignedTo } = req.body
    const update = { title, description, project, category, priority, assignedTo }
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key])

    const incident = await Incident.findByIdAndUpdate(id, update, { new: true })
    if (!incident) return res.status(404).json({ message: 'Incident not found' })

    await logActivity({
      user: req.user._id,
      action: `Updated incident "${incident.title}"`,
      entity: 'incident',
      entityId: incident._id,
    })

    return res.status(200).json(incident)
  }

  if (req.method === 'DELETE') {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' })
    }
    const incident = await Incident.findByIdAndDelete(id)
    if (!incident) return res.status(404).json({ message: 'Incident not found' })

    await logActivity({
      user: req.user._id,
      action: `Deleted incident "${incident.title}"`,
      entity: 'incident',
      entityId: incident._id,
    })

    return res.status(200).json({ message: 'Incident deleted' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default protect(handler)
