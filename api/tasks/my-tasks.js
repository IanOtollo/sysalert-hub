import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Task from '../../models/Task.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate('incident', 'title')
    .populate('project', 'title')
    .populate('assignedBy', 'fullName email')
    .sort({ dueDate: 1 })

  return res.status(200).json(tasks)
}

export default protect(handler)
