import mongoose from 'mongoose'

const awakeningSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    vision: { type: String, default: '' },
    antiVision: { type: String, default: '' },
  },
  { timestamps: true }
)

export const Awakening = mongoose.model('Awakening', awakeningSchema)
