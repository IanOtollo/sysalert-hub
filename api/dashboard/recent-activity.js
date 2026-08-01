import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import ActivityLog from '../../models/ActivityLog.js'
import Project from '../../models/Project.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

  let filter
  if (req.user.role === 'admin') {
    filter = {}
  } else if (req.user.role === 'teamlead') {
    // Scope to activity by the team lead themself plus anyone on a project they lead.
    const projects = await Project.find({ teamLead: req.user._id }).select('developers client')
    const teamMemberIds = new Set([req.user._id.toString()])
    projects.forEach((p) => {
      p.developers.forEach((d) => teamMemberIds.add(d.toString()))
      if (p.client) teamMemberIds.add(p.client.toString())
    })
    filter = { user: { $in: Array.from(teamMemberIds) } }
  } else {
    filter = { user: req.user._id }
  }

  const activity = await ActivityLog.find(filter)
    .populate('user', 'fullName email role')
    .sort({ createdAt: -1 })
    .limit(20)

  return res.status(200).json(activity)
}

export default protect(handler)
