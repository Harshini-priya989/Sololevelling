import { Awakening } from '../models/Awakening.js'

export const getAwakening = async (req, res, next) => {
  try {
    const awakening = await Awakening.findOne({ user: req.user._id }).lean()
    res.json({ awakening })
  } catch (error) {
    next(error)
  }
}

export const updateAwakening = async (req, res, next) => {
  try {
    const awakening = await Awakening.findOneAndUpdate(
      { user: req.user._id },
      { vision: req.body.vision || '', antiVision: req.body.antiVision || '' },
      { new: true, upsert: true }
    )
    res.json({ awakening })
  } catch (error) {
    next(error)
  }
}
