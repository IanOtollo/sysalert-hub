import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import ActivityLog from '../../models/ActivityLog.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

  const { userId, entity, limit } = req.query
  const filter = {}
  if (userId) filter.user = userId
  if (entity) filter.entity = entity

  const logs = await ActivityLog.find(filter)
    .populate('user', 'fullName email role')
    .sort({ createdAt: -1 })
    .limit(limit ? parseInt(limit, 10) : 200)

  return res.status(200).json(logs)
}

export default protect(handler, ['admin'])
