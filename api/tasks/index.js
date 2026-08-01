import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Task from '../../models/Task.js'
import Project from '../../models/Project.js'
import createNotification from '../../lib/createNotification.js'
import logActivity from '../../lib/logActivity.js'
import parseSlug from '../../lib/parseSlug.js'

async function buildRoleFilter(user) {
  if (user.role === 'admin') return {}

  if (user.role === 'teamlead') {
    const projects = await Project.find({ teamLead: user._id }).select('_id')
    const projectIds = projects.map((p) => p._id)
    return { $or: [{ project: { $in: projectIds } }, { assignedBy: user._id }] }
  }

  if (user.role === 'developer') {
    return { assignedTo: user._id }
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
    const tasks = await Task.find(filter)
      .populate('incident', 'title')
      .populate('project', 'title')
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .sort({ createdAt: -1 })

    return res.status(200).json(tasks)
  }

  if (req.method === 'POST') {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' })
    }

    const { title, description, incident, project, assignedTo, priority, dueDate } = req.body
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and assignedTo are required' })
    }

    const task = await Task.create({
      title,
      description,
      incident,
      project,
      assignedTo,
      priority,
      dueDate,
      assignedBy: req.user._id,
    })

    await logActivity({
      user: req.user._id,
      action: `Assigned task "${task.title}" to user`,
      entity: 'task',
      entityId: task._id,
    })

    await createNotification({
      sender: req.user._id,
      receiver: assignedTo,
      message: `New task assigned: "${task.title}"`,
      type: 'task',
      referenceId: task._id,
    })

    return res.status(201).json(task)
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

async function myTasks(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate('incident', 'title')
    .populate('project', 'title')
    .populate('assignedBy', 'fullName email')
    .sort({ dueDate: 1 })

  return res.status(200).json(tasks)
}

async function byId(req, res, id) {
  if (req.method === 'GET') {
    const task = await Task.findById(id)
      .populate('incident', 'title')
      .populate('project', 'title')
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email')
    if (!task) return res.status(404).json({ message: 'Task not found' })
    return res.status(200).json(task)
  }

  if (req.method === 'PUT') {
    const { title, description, incident, project, assignedTo, priority, dueDate } = req.body
    const update = { title, description, incident, project, assignedTo, priority, dueDate }
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key])

    const task = await Task.findByIdAndUpdate(id, update, { new: true })
    if (!task) return res.status(404).json({ message: 'Task not found' })

    await logActivity({
      user: req.user._id,
      action: `Updated task "${task.title}"`,
      entity: 'task',
      entityId: task._id,
    })

    return res.status(200).json(task)
  }

  if (req.method === 'DELETE') {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' })
    }
    const task = await Task.findByIdAndDelete(id)
    if (!task) return res.status(404).json({ message: 'Task not found' })

    await logActivity({
      user: req.user._id,
      action: `Deleted task "${task.title}"`,
      entity: 'task',
      entityId: task._id,
    })

    return res.status(200).json({ message: 'Task deleted' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

async function status(req, res, id) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { status: newStatus } = req.body

  const validStatuses = ['pending', 'in-progress', 'completed', 'overdue']
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }

  const task = await Task.findById(id).populate('incident', 'reportedBy title')
  if (!task) return res.status(404).json({ message: 'Task not found' })

  task.status = newStatus
  if (newStatus === 'completed') task.completedAt = new Date()
  await task.save()

  await logActivity({
    user: req.user._id,
    action: `Changed task "${task.title}" status to ${newStatus}`,
    entity: 'task',
    entityId: task._id,
  })

  const receivers = new Set()
  if (task.assignedBy) receivers.add(task.assignedBy.toString())
  if (task.incident?.reportedBy) receivers.add(task.incident.reportedBy.toString())

  if (task.project) {
    const project = await Project.findById(task.project).select('teamLead')
    if (project?.teamLead) receivers.add(project.teamLead.toString())
  }

  await createNotification({
    sender: req.user._id,
    receiver: Array.from(receivers),
    message: `Task "${task.title}" status changed to ${newStatus}`,
    type: 'task',
    referenceId: task._id,
  })

  return res.status(200).json(task)
}

async function dispatch(req, res) {
  const slug = parseSlug(req, '/api/tasks')

  if (slug.length === 0) return index(req, res)
  if (slug.length === 1 && slug[0] === 'my-tasks') return myTasks(req, res)
  if (slug.length === 1) return byId(req, res, slug[0])
  if (slug.length === 2 && slug[1] === 'status') return status(req, res, slug[0])

  return res.status(404).json({ message: 'Not found' })
}

const wrapped = protect(dispatch)

export default async function handler(req, res) {
  await dbConnect()
  return wrapped(req, res)
}
