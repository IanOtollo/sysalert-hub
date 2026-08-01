import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Project from '../../models/Project.js'
import logActivity from '../../lib/logActivity.js'

async function handler(req, res) {
  await dbConnect()
  const { id } = req.query

  if (req.method === 'GET') {
    const project = await Project.findById(id)
      .populate('client', 'fullName email')
      .populate('teamLead', 'fullName email')
      .populate('developers', 'fullName email')
      .populate('createdBy', 'fullName email')
    if (!project) return res.status(404).json({ message: 'Project not found' })
    return res.status(200).json(project)
  }

  if (req.method === 'PUT') {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' })
    }
    const { title, description, client, teamLead, developers, status, startDate, endDate } = req.body
    const update = { title, description, client, teamLead, developers, status, startDate, endDate }
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key])

    const project = await Project.findByIdAndUpdate(id, update, { new: true })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    await logActivity({
      user: req.user._id,
      action: `Updated project "${project.title}"`,
      entity: 'project',
      entityId: project._id,
    })

    return res.status(200).json(project)
  }

  if (req.method === 'DELETE') {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' })
    }
    const project = await Project.findByIdAndDelete(id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    await logActivity({
      user: req.user._id,
      action: `Deleted project "${project.title}"`,
      entity: 'project',
      entityId: project._id,
    })

    return res.status(200).json({ message: 'Project deleted' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default protect(handler)
