import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Incident from '../../models/Incident.js'
import Task from '../../models/Task.js'
import Project from '../../models/Project.js'
import User from '../../models/User.js'

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

async function taskFilter(user) {
  if (user.role === 'admin') return {}
  if (user.role === 'teamlead') {
    const projects = await Project.find({ teamLead: user._id }).select('_id')
    return { $or: [{ project: { $in: projects.map((p) => p._id) } }, { assignedBy: user._id }] }
  }
  if (user.role === 'developer') return { assignedTo: user._id }
  if (user.role === 'client') {
    const projects = await Project.find({ client: user._id }).select('_id')
    return { project: { $in: projects.map((p) => p._id) } }
  }
  return { _id: null }
}

function projectFilter(user) {
  if (user.role === 'admin') return {}
  if (user.role === 'teamlead') return { teamLead: user._id }
  if (user.role === 'developer') return { developers: user._id }
  if (user.role === 'client') return { client: user._id }
  return { _id: null }
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

  const incFilter = await incidentFilter(req.user)
  const taskF = await taskFilter(req.user)

  const [
    totalIncidents,
    openIncidents,
    resolvedIncidents,
    criticalIncidents,
    totalTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    totalProjects,
    totalUsers,
  ] = await Promise.all([
    Incident.countDocuments(incFilter),
    Incident.countDocuments({ ...incFilter, status: 'open' }),
    Incident.countDocuments({ ...incFilter, status: 'resolved' }),
    Incident.countDocuments({ ...incFilter, priority: 'critical' }),
    Task.countDocuments(taskF),
    Task.countDocuments({ ...taskF, status: 'pending' }),
    Task.countDocuments({ ...taskF, status: 'completed' }),
    Task.countDocuments({ ...taskF, status: 'overdue' }),
    Project.countDocuments(projectFilter(req.user)),
    req.user.role === 'admin' ? User.countDocuments() : Promise.resolve(0),
  ])

  return res.status(200).json({
    totalIncidents,
    openIncidents,
    resolvedIncidents,
    criticalIncidents,
    totalTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    totalProjects,
    totalUsers,
  })
}

export default protect(handler)
