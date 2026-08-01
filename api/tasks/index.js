import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Task from '../../models/Task.js'
import Project from '../../models/Project.js'
import createNotification from '../../lib/createNotification.js'
import logActivity from '../../lib/logActivity.js'

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

async function handler(req, res) {
  await dbConnect()

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

export default protect(handler)
