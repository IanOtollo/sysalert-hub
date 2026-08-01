import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Notification from '../../models/Notification.js'

async function handler(req, res) {
  await dbConnect()

  if (req.method === 'GET') {
    const notifications = await Notification.find({ receiver: req.user._id })
      .populate('sender', 'fullName email')
      .sort({ createdAt: -1 })
    return res.status(200).json(notifications)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ message: 'id is required' })

    const notification = await Notification.findOne({ _id: id, receiver: req.user._id })
    if (!notification) return res.status(404).json({ message: 'Notification not found' })

    await notification.deleteOne()
    return res.status(200).json({ message: 'Notification deleted' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default protect(handler)
