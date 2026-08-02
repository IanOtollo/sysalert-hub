import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import ActivityLog from '../../models/ActivityLog.js'
// Referenced by .populate() below — see note in api/incidents/index.js.
import User from '../../models/User.js'
import parseSlug from '../../lib/parseSlug.js'

async function index(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { userId, entity, page, limit } = req.query
  const filter = {}
  if (userId) filter.user = userId
  if (entity) filter.entity = entity

  const pageSize = limit ? parseInt(limit, 10) : 20
  const pageNum = page ? Math.max(parseInt(page, 10), 1) : 1

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    ActivityLog.countDocuments(filter),
  ])

  return res.status(200).json({
    logs,
    total,
    page: pageNum,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  })
}

async function byUser(req, res, id) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const logs = await ActivityLog.find({ user: id })
    .populate('user', 'fullName email role')
    .sort({ createdAt: -1 })

  return res.status(200).json(logs)
}

async function dispatch(req, res) {
  const slug = parseSlug(req, '/api/logs')

  if (slug.length === 0) return index(req, res)
  if (slug.length === 2 && slug[0] === 'user') return byUser(req, res, slug[1])

  return res.status(404).json({ message: 'Not found' })
}

const wrapped = protect(dispatch, ['admin'])

export default async function handler(req, res) {
  await dbConnect()
  return wrapped(req, res)
}
