import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Not authorized, no token')
    err.statusCode = 401
    throw err
  }
  const token = authHeader.split(' ')[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (e) {
    const err = new Error('Not authorized, token invalid')
    err.statusCode = 401
    throw err
  }
  const user = await User.findById(decoded.id).select('-password')
  if (!user || !user.isActive) {
    const err = new Error('Not authorized, user not found or inactive')
    err.statusCode = 401
    throw err
  }
  return user
}

// Wraps a Vercel/Express-style (req, res) handler with auth + optional role check.
export function protect(handler, allowedRoles = []) {
  return async (req, res) => {
    try {
      const user = await getUserFromRequest(req)
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' })
      }
      req.user = user
      return handler(req, res)
    } catch (err) {
      return res.status(err.statusCode || 401).json({ message: err.message || 'Not authorized' })
    }
  }
}
