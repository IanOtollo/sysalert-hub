import bcrypt from 'bcryptjs'
import dbConnect from '../../lib/dbConnect.js'
import { protect, signToken } from '../../lib/authMiddleware.js'
import User from '../../models/User.js'
import logActivity from '../../lib/logActivity.js'

async function login(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  return res.status(200).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profile: user.profile,
    token: signToken(user),
  })
}

async function me(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  return res.status(200).json(req.user)
}

async function register(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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

const wrappedMe = protect(me)
const wrappedRegister = protect(register, ['admin', 'teamlead'])

export default async function handler(req, res) {
  await dbConnect()
  const slug = (req.query.slug || []).join('/')

  if (slug === 'login') return login(req, res)
  if (slug === 'me') return wrappedMe(req, res)
  if (slug === 'register') return wrappedRegister(req, res)

  return res.status(404).json({ message: 'Not found' })
}
