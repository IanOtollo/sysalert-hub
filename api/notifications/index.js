import dbConnect from '../../lib/dbConnect.js'
import { protect } from '../../lib/authMiddleware.js'
import Notification from '../../models/Notification.js'
import parseSlug from '../../lib/parseSlug.js'

async function index(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const notifications = await Notification.find({ receiver: req.user._id })
    .populate('sender', 'fullName email')
    .sort({ createdAt: -1 })
  return res.status(200).json(notifications)
}

async function readAll(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await Notification.updateMany({ receiver: req.user._id, isRead: false }, { isRead: true })

  return res.status(200).json({ message: 'All notifications marked as read' })
}

async function byId(req, res, id) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const notification = await Notification.findOne({ _id: id, receiver: req.user._id })
  if (!notification) return res.status(404).json({ message: 'Notification not found' })

  await notification.deleteOne()
  return res.status(200).json({ message: 'Notification deleted' })
}

async function markRead(req, res, id) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const notification = await Notification.findOne({ _id: id, receiver: req.user._id })
  if (!notification) return res.status(404).json({ message: 'Notification not found' })

  notification.isRead = true
  await notification.save()

  return res.status(200).json(notification)
}

async function dispatch(req, res) {
  const slug = parseSlug(req, '/api/notifications')

  if (slug.length === 0) return index(req, res)
  if (slug.length === 1 && slug[0] === 'read-all') return readAll(req, res)
  if (slug.length === 1) return byId(req, res, slug[0])
  if (slug.length === 2 && slug[1] === 'read') return markRead(req, res, slug[0])

  return res.status(404).json({ message: 'Not found' })
}

const wrapped = protect(dispatch)

export default async function handler(req, res) {
  await dbConnect()
  return wrapped(req, res)
}
