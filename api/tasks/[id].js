import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Task from '../../models/Task.js'
import logActivity from '../../lib/logActivity.js'

async function handler(req, res) {
  await dbConnect()
  const { id } = req.query

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

export default protect(handler)
