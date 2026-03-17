import mongoose from 'mongoose'

const rewardLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rewardId: { type: String, required: true },
    title: { type: String, required: true },
    cost: { type: Number, required: true },
    at: { type: String, required: true },
  },
  { timestamps: true }
)

export const RewardLog = mongoose.model('RewardLog', rewardLogSchema)
