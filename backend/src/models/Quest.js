import mongoose from 'mongoose'

const questSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true, default: 'Normal' },
    category: { type: String, default: 'General' },
    questType: { type: String, enum: ['daily', 'weekly', 'one-time'], default: 'daily' },
    notes: { type: String, default: '' },
    xp: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    deadline: { type: String, default: '' },
    status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
    completedAt: { type: String, default: null },
    failedAt: { type: String, default: null },
  },
  { timestamps: true }
)

questSchema.index({ user: 1, questId: 1 }, { unique: true })

export const Quest = mongoose.model('Quest', questSchema)
