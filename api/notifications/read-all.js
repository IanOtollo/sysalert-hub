import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Notification from '../../models/Notification.js'

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

  await Notification.updateMany({ receiver: req.user._id, isRead: false }, { isRead: true })

  return res.status(200).json({ message: 'All notifications marked as read' })
}

export default protect(handler)
