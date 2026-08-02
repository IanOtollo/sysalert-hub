import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Incident from '../../models/Incident.js'
import Project from '../../models/Project.js'
// Referenced by .populate() below — Vercel bundles each function in
// isolation, so the model must be imported directly to register its
// schema, even though it isn't used by name in this file otherwise.
import User from '../../models/User.js'
import createNotification from '../../lib/createNotification.js'
import logActivity from '../../lib/logActivity.js'
import canAccessIncident from '../../lib/incidentAccess.js'
import parseSlug from '../../lib/parseSlug.js'

async function buildRoleFilter(user) {
  if (user.role === 'admin') return {}

  if (user.role === 'teamlead') {
    const projects = await Project.find({ teamLead: user._id }).select('_id')
    const projectIds = projects.map((p) => p._id)
    return { $or: [{ project: { $in: projectIds } }, { reportedBy: user._id }, { assignedTo: user._id }] }
  }

  if (user.role === 'developer') {
    return { $or: [{ assignedTo: user._id }, { reportedBy: user._id }] }
  }

  if (user.role === 'client') {
    const projects = await Project.find({ client: user._id }).select('_id')
    const projectIds = projects.map((p) => p._id)
    return { project: { $in: projectIds } }
  }

  return { _id: null }
}

async function index(req, res) {
  if (req.method === 'GET') {
    const filter = await buildRoleFilter(req.user)
    const incidents = await Incident.find(filter)
      .populate('project', 'title')
      .populate('reportedBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 })

    return res.status(200).json(incidents)
  }

  if (req.method === 'POST') {
    if (!['admin', 'teamlead', 'client'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: only admins, team leads, and clients can submit incidents' })
    }

    const { title, description, project, category, priority, assignedTo } = req.body
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' })
    }

    // Clients submit feedback/requirements on their own project only — no
    // assigning, and the project must actually be theirs.
    let assignee = assignedTo
    if (req.user.role === 'client') {
      assignee = undefined
      if (!project) return res.status(400).json({ message: 'Project is required' })
      const owns = await Project.exists({ _id: project, client: req.user._id })
      if (!owns) return res.status(403).json({ message: 'Forbidden: not your project' })
    }

    const incident = await Incident.create({
      title,
      description,
      project,
      category,
      priority,
      assignedTo: assignee,
      reportedBy: req.user._id,
    })

    await logActivity({
      user: req.user._id,
      action: `Reported incident "${incident.title}"`,
      entity: 'incident',
      entityId: incident._id,
    })

    // Notify assigned developer + team lead of the project.
    const receivers = []
    if (assignee) receivers.push(assignee)
    if (project) {
      const proj = await Project.findById(project).select('teamLead')
      if (proj?.teamLead) receivers.push(proj.teamLead)
    }

    await createNotification({
      sender: req.user._id,
      receiver: receivers,
      message: `New incident reported: "${incident.title}"`,
      type: 'incident',
      referenceId: incident._id,
    })

    return res.status(201).json(incident)
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

async function byId(req, res, id) {
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

async function status(req, res, id) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!['admin', 'teamlead'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: only admins and team leads can change incident status' })
  }

  const { status: newStatus } = req.body

  const validStatuses = ['open', 'in-progress', 'resolved', 'closed']
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }

  const incident = await Incident.findById(id).populate('project', 'teamLead client')
  if (!incident) return res.status(404).json({ message: 'Incident not found' })
  if (!canAccessIncident(req.user, incident)) {
    return res.status(403).json({ message: 'Forbidden: you do not have access to this incident' })
  }

  incident.status = newStatus
  if (newStatus === 'resolved') incident.resolvedAt = new Date()
  await incident.save()

  await logActivity({
    user: req.user._id,
    action: `Changed incident "${incident.title}" status to ${newStatus}`,
    entity: 'incident',
    entityId: incident._id,
  })

  const receivers = new Set()
  if (incident.reportedBy) receivers.add(incident.reportedBy.toString())

  const project = incident.project
  if (project?.teamLead) receivers.add(project.teamLead.toString())
  if (newStatus === 'resolved' && project?.client) {
    receivers.add(project.client.toString())
  }

  await createNotification({
    sender: req.user._id,
    receiver: Array.from(receivers),
    message:
      newStatus === 'resolved'
        ? `Incident "${incident.title}" has been resolved`
        : `Incident "${incident.title}" status changed to ${newStatus}`,
    type: 'incident',
    referenceId: incident._id,
  })

  return res.status(200).json(incident)
}

async function comment(req, res, id) {
  if (req.method === 'POST') {
    const { comment: commentText } = req.body
    if (!commentText) return res.status(400).json({ message: 'Comment text is required' })

    const incident = await Incident.findById(id).populate('project', 'teamLead client')
    if (!incident) return res.status(404).json({ message: 'Incident not found' })
    if (!canAccessIncident(req.user, incident)) {
      return res.status(403).json({ message: 'Forbidden: you do not have access to this incident' })
    }

    incident.comments.push({ user: req.user._id, email: req.user.email, comment: commentText })
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

async function dispatch(req, res) {
  const slug = parseSlug(req, '/api/incidents')

  if (slug.length === 0) return index(req, res)
  if (slug.length === 1) return byId(req, res, slug[0])
  if (slug.length === 2 && slug[1] === 'status') return status(req, res, slug[0])
  if (slug.length === 2 && slug[1] === 'comment') return comment(req, res, slug[0])

  return res.status(404).json({ message: 'Not found' })
}

const wrapped = protect(dispatch)

export default async function handler(req, res) {
  await dbConnect()
  return wrapped(req, res)
}
