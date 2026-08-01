import bcrypt from 'bcryptjs'
import dbConnect from '../../lib/dbConnect.js'
import { signToken } from '../../lib/authMiddleware.js'
import User from '../../models/User.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

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
