import { Habit } from '../models/Habit.js'
import { applyXpTransaction, getProfileOrThrow } from '../services/gameStateService.js'
import { toDateKey } from '../services/gameMath.js'

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: 1 }).lean()
    res.json({ habits })
  } catch (error) {
    next(error)
  }
}

export const createHabit = async (req, res, next) => {
  try {
    const habit = await Habit.create({
      user: req.user._id,
      habitId: createId('habit'),
      title: String(req.body.title || '').trim(),
      xpReward: Number(req.body.xpReward || 25),
      xpPenalty: Number(req.body.xpPenalty || 0),
      category: String(req.body.category || 'General').trim() || 'General',
      notes: String(req.body.notes || '').trim(),
      required: Boolean(req.body.required),
      locked: false,
      streak: 0,
      history: {},
      lastCompleted: '',
    })
    res.status(201).json({ habit })
  } catch (error) {
    next(error)
  }
}

export const updateHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ user: req.user._id, habitId: req.params.habitId })
    if (!habit) return res.status(404).json({ message: 'Habit not found' })

    habit.title = String(req.body.title ?? habit.title).trim() || habit.title
    habit.xpReward = Number(req.body.xpReward ?? habit.xpReward)
    habit.xpPenalty = Number(req.body.xpPenalty ?? habit.xpPenalty)
    habit.category = String(req.body.category ?? habit.category).trim() || habit.category
    habit.notes = String(req.body.notes ?? habit.notes).trim()
    habit.required = req.body.required === undefined ? habit.required : Boolean(req.body.required)
    await habit.save()

    res.json({ habit })
  } catch (error) {
    next(error)
  }
}

export const deleteHabit = async (req, res, next) => {
  try {
    const deleted = await Habit.findOneAndDelete({ user: req.user._id, habitId: req.params.habitId })
    if (!deleted) return res.status(404).json({ message: 'Habit not found' })
    res.json({ message: 'Habit deleted' })
  } catch (error) {
    next(error)
  }
}

export const completeHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ user: req.user._id, habitId: req.params.habitId })
    if (!habit) return res.status(404).json({ message: 'Habit not found' })

    const today = toDateKey()
    if (habit.lastCompleted === today) return res.status(400).json({ message: 'Habit already completed today' })

    const now = new Date()
    const history = { ...(habit.history || {}), [today]: 1 }
    const last = habit.lastCompleted ? new Date(habit.lastCompleted) : null
    const diffDays = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : null
    habit.streak = diffDays === 1 ? habit.streak + 1 : 1
    habit.history = history
    habit.lastCompleted = today
    await habit.save()

    const profile = await getProfileOrThrow(req.user._id)
    applyXpTransaction(profile, habit.xpReward, { trackHistory: true, dateKey: today, historyPatch: { habitsDoneDelta: 1 } })
    await profile.save()

    res.json({ message: 'Habit completed', habit, state: profile })
  } catch (error) {
    next(error)
  }
}
