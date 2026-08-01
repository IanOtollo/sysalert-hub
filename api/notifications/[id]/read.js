import dbConnect from '../../../lib/dbConnect.js'
import { protect } from '../../../lib/authMiddleware.js'
import Notification from '../../../models/Notification.js'

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()
  const { id } = req.query

  const notification = await Notification.findOne({ _id: id, receiver: req.user._id })
  if (!notification) return res.status(404).json({ message: 'Notification not found' })

  notification.isRead = true
  await notification.save()

  return res.status(200).json(notification)
}

export default protect(handler)
