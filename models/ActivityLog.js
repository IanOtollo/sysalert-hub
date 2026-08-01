import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: {
    type: String,
    enum: ['incident', 'task', 'project', 'user', 'notification'],
    required: true,
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema)
