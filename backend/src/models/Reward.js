import mongoose from 'mongoose'

const rewardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rewardId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    cooldownDays: { type: Number, default: 1 },
    redeemCount: { type: Number, default: 0 },
    lastRedeemedAt: { type: String, default: '' },
  },
  { timestamps: true }
)

rewardSchema.index({ user: 1, rewardId: 1 }, { unique: true })

export const Reward = mongoose.model('Reward', rewardSchema)
