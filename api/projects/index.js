import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Project from '../../models/Project.js'
import logActivity from '../../lib/logActivity.js'

async function handler(req, res) {
  await dbConnect()

  if (req.method === 'GET') {
    if (req.user.role === 'developer') {
      return res.status(403).json({ message: 'Forbidden: developers do not have access to the projects list' })
    }

    let filter = {}
    if (req.user.role === 'teamlead') {
      filter = { teamLead: req.user._id }
    } else if (req.user.role === 'client') {
      filter = { client: req.user._id }
    }

    const projects = await Project.find(filter)
      .populate('client', 'fullName email')
      .populate('teamLead', 'fullName email')
      .populate('developers', 'fullName email')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })

    return res.status(200).json(projects)
  }

  if (req.method === 'POST') {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' })
    }

    const { title, description, client, teamLead, developers, status, startDate, endDate } = req.body
    if (!title) return res.status(400).json({ message: 'Title is required' })

    const project = await Project.create({
      title,
      description,
      client,
      teamLead,
      developers,
      status,
      startDate,
      endDate,
      createdBy: req.user._id,
    })

    await logActivity({
      user: req.user._id,
      action: `Created project "${project.title}"`,
      entity: 'project',
      entityId: project._id,
    })

    return res.status(201).json(project)
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default protect(handler)
