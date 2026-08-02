import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Project from '../../models/Project.js'
// Referenced by .populate() below — see note in api/incidents/index.js.
import User from '../../models/User.js'
import logActivity from '../../lib/logActivity.js'
import parseSlug from '../../lib/parseSlug.js'

async function index(req, res) {
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

async function byId(req, res, id) {
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

async function dispatch(req, res) {
  const slug = parseSlug(req, '/api/projects')

  if (slug.length === 0) return index(req, res)
  if (slug.length === 1) return byId(req, res, slug[0])

  return res.status(404).json({ message: 'Not found' })
}

const wrapped = protect(dispatch)

export default async function handler(req, res) {
  await dbConnect()
  return wrapped(req, res)
}
