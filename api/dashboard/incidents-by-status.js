import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Incident from '../../models/Incident.js'
import Project from '../../models/Project.js'

async function incidentFilter(user) {
  if (user.role === 'admin') return {}
  if (user.role === 'teamlead') {
    const projects = await Project.find({ teamLead: user._id }).select('_id')
    return { $or: [{ project: { $in: projects.map((p) => p._id) } }, { reportedBy: user._id }, { assignedTo: user._id }] }
  }
  if (user.role === 'developer') return { $or: [{ assignedTo: user._id }, { reportedBy: user._id }] }
  if (user.role === 'client') {
    const projects = await Project.find({ client: user._id }).select('_id')
    return { project: { $in: projects.map((p) => p._id) } }
  }
  return { _id: null }
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()
  const filter = await incidentFilter(req.user)

  const results = await Incident.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  const statuses = ['open', 'in-progress', 'resolved', 'closed']
  const data = statuses.map((status) => ({
    status,
    count: results.find((r) => r._id === status)?.count || 0,
  }))

  return res.status(200).json(data)
}

export default protect(handler)
