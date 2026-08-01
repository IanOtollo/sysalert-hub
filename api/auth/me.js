import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

  return res.status(200).json(req.user)
}

export default protect(handler)
