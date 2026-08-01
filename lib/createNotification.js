import Notification from '../models/Notification.js'

// receiver(s) may be a single user id or an array of user ids.
export default async function createNotification({ sender, receiver, message, type = 'system', referenceId }) {
  const receivers = Array.isArray(receiver) ? receiver : [receiver]

  const uniqueReceivers = [...new Set(receivers.filter(Boolean).map((r) => r.toString()))]
    .filter((r) => !sender || r !== sender.toString())

  if (uniqueReceivers.length === 0) return []

  const docs = uniqueReceivers.map((receiverId) => ({
    sender: sender || null,
    receiver: receiverId,
    message,
    type,
    referenceId: referenceId || null,
  }))

  return Notification.insertMany(docs)
}
