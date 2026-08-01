import bcrypt from 'bcryptjs'
import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import User from '../../models/User.js'
import logActivity from '../../lib/logActivity.js'
import parseSlug from '../../lib/parseSlug.js'

async function index(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const users = await User.find().select('-password').sort({ createdAt: -1 })
  return res.status(200).json(users)
}

async function byId(req, res, id) {
  const isSelf = req.user._id.toString() === id
  const isAdmin = req.user.role === 'admin'

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' })
  }

  if (req.method === 'GET') {
    const user = await User.findById(id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.status(200).json(user)
  }

  if (req.method === 'PUT') {
    const { fullName, phone, role, profile, isActive, password } = req.body
    const update = { fullName, phone, profile }
    // Only an admin may change role/active-status — including their own.
    if (isAdmin) {
      update.role = role
      update.isActive = isActive
    }
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key])

    if (password) {
      const salt = await bcrypt.genSalt(10)
      update.password = await bcrypt.hash(password, salt)
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })

    await logActivity({
      user: req.user._id,
      action: `Updated user ${user.email}`,
      entity: 'user',
      entityId: user._id,
    })

    return res.status(200).json(user)
  }

  if (req.method === 'DELETE') {
    if (!isAdmin) return res.status(403).json({ message: 'Forbidden: admin only' })
    const user = await User.findByIdAndDelete(id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    await logActivity({
      user: req.user._id,
      action: `Deleted user ${user.email}`,
      entity: 'user',
      entityId: user._id,
    })

    return res.status(200).json({ message: 'User deleted' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

// Team leads need the roster to assign developers/clients to projects,
// incidents, and tasks — write operations remain admin-only via byId.
async function dispatch(req, res) {
  const slug = parseSlug(req, '/api/users')

  if (slug.length === 0) {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' })
    }
    return index(req, res)
  }

  // Role check for self-vs-admin access happens inside byId.
  if (slug.length === 1) return byId(req, res, slug[0])

  return res.status(404).json({ message: 'Not found' })
}

const wrapped = protect(dispatch)

export default async function handler(req, res) {
  await dbConnect()
  return wrapped(req, res)
}
