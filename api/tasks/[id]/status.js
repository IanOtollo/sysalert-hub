import dbConnect from '../../../lib/dbConnect.js'
import { protect } from '../../../lib/authMiddleware.js'
import Task from '../../../models/Task.js'
import Project from '../../../models/Project.js'
import createNotification from '../../../lib/createNotification.js'
import logActivity from '../../../lib/logActivity.js'

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()
  const { id } = req.query
  const { status } = req.body

  const validStatuses = ['pending', 'in-progress', 'completed', 'overdue']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }

  const task = await Task.findById(id).populate('incident', 'reportedBy title')
  if (!task) return res.status(404).json({ message: 'Task not found' })

  task.status = status
  if (status === 'completed') task.completedAt = new Date()
  await task.save()

  await logActivity({
    user: req.user._id,
    action: `Changed task "${task.title}" status to ${status}`,
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
    message: `Task "${task.title}" status changed to ${status}`,
    type: 'task',
    referenceId: task._id,
  })

  return res.status(200).json(task)
}

export default protect(handler)
