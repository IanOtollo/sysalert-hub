import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import User from '../../models/User.js'

async function handler(req, res) {
  await dbConnect()

  if (req.method === 'GET') {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    return res.status(200).json(users)
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

// Team leads need the roster to assign developers/clients to projects,
// incidents, and tasks — write operations remain admin-only via [id].js.
export default protect(handler, ['admin', 'teamlead'])
