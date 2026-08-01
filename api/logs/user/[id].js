import dbConnect from '../../../lib/dbConnect.js'
import { protect } from '../../../lib/authMiddleware.js'
import ActivityLog from '../../../models/ActivityLog.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()
  const { id } = req.query

  const logs = await ActivityLog.find({ user: id })
    .populate('user', 'fullName email role')
    .sort({ createdAt: -1 })

  return res.status(200).json(logs)
}

export default protect(handler, ['admin'])
