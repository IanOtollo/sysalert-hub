import bcrypt from 'bcryptjs'
import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import User from '../../models/User.js'
import logActivity from '../../lib/logActivity.js'

async function handler(req, res) {
  await dbConnect()
  const { id } = req.query
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

// Role check for self-vs-admin access happens inside the handler.
export default protect(handler)
