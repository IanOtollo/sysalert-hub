import bcrypt from 'bcryptjs'
import dbConnect from '../../lib/dbConnect.js'
import { protect, signToken } from '../../lib/authMiddleware.js'
import User from '../../models/User.js'
import logActivity from '../../lib/logActivity.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

  const { fullName, email, password, phone, role, profile } = req.body

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'fullName, email and password are required' })
  }

  // Team leads may only onboard clients (e.g. from the "New Project" form) —
  // creating other roles stays admin-only to avoid privilege escalation.
  if (req.user.role === 'teamlead' && role !== 'client') {
    return res.status(403).json({ message: 'Team leads can only create client accounts' })
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    return res.status(400).json({ message: 'A user with this email already exists' })
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    role: role || 'developer',
    profile,
  })

  await logActivity({
    user: req.user._id,
    action: `Created user ${user.email}`,
    entity: 'user',
    entityId: user._id,
    details: `Role: ${user.role}`,
  })

  return res.status(201).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    token: signToken(user),
  })
}

export default protect(handler, ['admin', 'teamlead'])
