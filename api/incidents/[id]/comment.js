import dbConnect from '../../../lib/dbConnect.js'
import { protect } from '../../../lib/authMiddleware.js'
import Incident from '../../../models/Incident.js'
import createNotification from '../../../lib/createNotification.js'
import logActivity from '../../../lib/logActivity.js'
import canAccessIncident from '../../../lib/incidentAccess.js'

async function handler(req, res) {
  await dbConnect()
  const { id } = req.query

  if (req.method === 'POST') {
    const { comment } = req.body
    if (!comment) return res.status(400).json({ message: 'Comment text is required' })

    const incident = await Incident.findById(id).populate('project', 'teamLead client')
    if (!incident) return res.status(404).json({ message: 'Incident not found' })
    if (!canAccessIncident(req.user, incident)) {
      return res.status(403).json({ message: 'Forbidden: you do not have access to this incident' })
    }

    incident.comments.push({ user: req.user._id, email: req.user.email, comment })
    await incident.save()

    await logActivity({
      user: req.user._id,
      action: `Commented on incident "${incident.title}"`,
      entity: 'incident',
      entityId: incident._id,
    })

    if (incident.reportedBy && incident.reportedBy.toString() !== req.user._id.toString()) {
      await createNotification({
        sender: req.user._id,
        receiver: incident.reportedBy,
        message: `New comment on incident "${incident.title}"`,
        type: 'comment',
        referenceId: incident._id,
      })
    }

    const populated = await Incident.findById(id).populate('comments.user', 'fullName email')
    return res.status(201).json(populated.comments)
  }

  if (req.method === 'DELETE') {
    const commentId = req.query.commentId || req.body?.commentId
    if (!commentId) return res.status(400).json({ message: 'commentId is required' })

    const incident = await Incident.findById(id).populate('project', 'teamLead client')
    if (!incident) return res.status(404).json({ message: 'Incident not found' })
    if (!canAccessIncident(req.user, incident)) {
      return res.status(403).json({ message: 'Forbidden: you do not have access to this incident' })
    }

    const target = incident.comments.id(commentId)
    if (!target) return res.status(404).json({ message: 'Comment not found' })

    const isOwner = target.user && target.user.toString() === req.user._id.toString()
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: cannot delete this comment' })
    }

    target.deleteOne()
    await incident.save()

    return res.status(200).json({ message: 'Comment deleted' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default protect(handler)
