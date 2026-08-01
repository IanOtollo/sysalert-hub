import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Incident from '../../models/Incident.js'
import Project from '../../models/Project.js'
import createNotification from '../../lib/createNotification.js'
import logActivity from '../../lib/logActivity.js'

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

async function handler(req, res) {
  await dbConnect()

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

export default protect(handler)
