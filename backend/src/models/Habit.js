import mongoose from 'mongoose'

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    habitId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    xpReward: { type: Number, default: 25 },
    xpPenalty: { type: Number, default: 0 },
    required: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    category: { type: String, default: 'General' },
    notes: { type: String, default: '' },
    streak: { type: Number, default: 0 },
    history: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastCompleted: { type: String, default: '' },
  },
  { timestamps: true }
)

habitSchema.index({ user: 1, habitId: 1 }, { unique: true })

export const Habit = mongoose.model('Habit', habitSchema)
