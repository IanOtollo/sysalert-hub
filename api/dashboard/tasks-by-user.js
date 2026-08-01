import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Task from '../../models/Task.js'
import Project from '../../models/Project.js'

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

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()
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

export default protect(handler)
