import ActivityLog from '../models/ActivityLog.js'

export default async function logActivity({ user, action, entity, entityId, details = '' }) {
  return ActivityLog.create({ user, action, entity, entityId, details })
}
