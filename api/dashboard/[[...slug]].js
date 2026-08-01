import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Incident from '../../models/Incident.js'
import Task from '../../models/Task.js'
import Project from '../../models/Project.js'
import User from '../../models/User.js'
import ActivityLog from '../../models/ActivityLog.js'

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

async function stats(req, res) {
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

async function incidentsByStatus(req, res) {
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

async function incidentsByPriority(req, res) {
  const filter = await incidentFilter(req.user)

  const results = await Incident.aggregate([
    { $match: filter },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ])

  const priorities = ['low', 'medium', 'high', 'critical']
  const data = priorities.map((priority) => ({
    priority,
    count: results.find((r) => r._id === priority)?.count || 0,
  }))

  return res.status(200).json(data)
}

async function tasksByUser(req, res) {
  const filter = await taskFilter(req.user)

  const results = await Task.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$assignedTo',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$user._id',
        fullName: '$user.fullName',
        total: 1,
        completed: 1,
      },
    },
    { $sort: { total: -1 } },
  ])

  return res.status(200).json(results)
}

async function recentActivity(req, res) {
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

const ROUTES = {
  stats,
  'incidents-by-status': incidentsByStatus,
  'incidents-by-priority': incidentsByPriority,
  'tasks-by-user': tasksByUser,
  'recent-activity': recentActivity,
}

async function dispatch(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const slug = (req.query.slug || []).join('/')
  const route = ROUTES[slug]
  if (!route) return res.status(404).json({ message: 'Not found' })

  return route(req, res)
}

const wrapped = protect(dispatch)

export default async function handler(req, res) {
  await dbConnect()
  return wrapped(req, res)
}
