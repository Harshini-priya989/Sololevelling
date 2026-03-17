import { GameProfile } from '../models/GameProfile.js'
import { Quest } from '../models/Quest.js'
import { applyGoldTransaction, applyXpTransaction, getProfileOrThrow } from '../services/gameStateService.js'
import { toDateKey } from '../services/gameMath.js'

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const getQuests = async (req, res, next) => {
  try {
    const quests = await Quest.find({ user: req.user._id }).sort({ createdAt: 1 }).lean()
    res.json({ quests })
  } catch (error) {
    next(error)
  }
}

export const createQuest = async (req, res, next) => {
  try {
    const quest = await Quest.create({
      user: req.user._id,
      questId: createId('quest'),
      title: String(req.body.title || '').trim(),
      difficulty: String(req.body.difficulty || 'Normal').trim() || 'Normal',
      category: String(req.body.category || 'General').trim() || 'General',
      questType: req.body.questType || 'daily',
      notes: String(req.body.notes || '').trim(),
      xp: Number(req.body.xp || 50),
      gold: Number(req.body.gold || 25),
      deadline: String(req.body.deadline || '').trim(),
      status: 'active',
      completedAt: null,
      failedAt: null,
    })
    res.status(201).json({ quest })
  } catch (error) {
    next(error)
  }
}

export const updateQuest = async (req, res, next) => {
  try {
    const quest = await Quest.findOne({ user: req.user._id, questId: req.params.questId })
    if (!quest) return res.status(404).json({ message: 'Quest not found' })

    quest.title = String(req.body.title ?? quest.title).trim() || quest.title
    quest.difficulty = String(req.body.difficulty ?? quest.difficulty).trim() || quest.difficulty
    quest.category = String(req.body.category ?? quest.category).trim() || quest.category
    quest.questType = req.body.questType || quest.questType
    quest.notes = String(req.body.notes ?? quest.notes).trim()
    quest.xp = Number(req.body.xp ?? quest.xp)
    quest.gold = Number(req.body.gold ?? quest.gold)
    quest.deadline = String(req.body.deadline ?? quest.deadline).trim()
    await quest.save()

    res.json({ quest })
  } catch (error) {
    next(error)
  }
}

export const deleteQuest = async (req, res, next) => {
  try {
    const deleted = await Quest.findOneAndDelete({ user: req.user._id, questId: req.params.questId })
    if (!deleted) return res.status(404).json({ message: 'Quest not found' })

    const profile = await GameProfile.findOne({ user: req.user._id })
    if (profile?.focusQuestId === req.params.questId) {
      profile.focusQuestId = ''
      await profile.save()
    }

    res.json({ message: 'Quest deleted' })
  } catch (error) {
    next(error)
  }
}

export const setFocusQuest = async (req, res, next) => {
  try {
    const profile = await GameProfile.findOne({ user: req.user._id })
    profile.focusQuestId = req.params.questId === 'none' ? '' : req.params.questId
    await profile.save()
    res.json({ focusId: profile.focusQuestId })
  } catch (error) {
    next(error)
  }
}

export const completeQuest = async (req, res, next) => {
  try {
    const quest = await Quest.findOne({ user: req.user._id, questId: req.params.questId })
    if (!quest) return res.status(404).json({ message: 'Quest not found' })
    if (quest.status !== 'active') return res.status(400).json({ message: 'Only active quests can be completed' })

    const now = new Date().toISOString()
    const dateKey = toDateKey(now)
    quest.status = 'completed'
    quest.completedAt = now
    await quest.save()

    const profile = await getProfileOrThrow(req.user._id)
    const bonus = profile.focusQuestId === quest.questId ? Math.ceil(quest.xp * 0.1) : 0
    applyXpTransaction(profile, quest.xp + bonus, { trackHistory: true, dateKey, historyPatch: { questsDoneDelta: 1 } })
    applyGoldTransaction(profile, quest.gold, { trackHistory: true, dateKey })
    if (profile.focusQuestId === quest.questId) profile.focusQuestId = ''
    await profile.save()

    res.json({ message: 'Quest completed', quest, rewards: { xp: quest.xp + bonus, gold: quest.gold, bonusXp: bonus }, state: profile })
  } catch (error) {
    next(error)
  }
}

export const failQuest = async (req, res, next) => {
  try {
    const quest = await Quest.findOne({ user: req.user._id, questId: req.params.questId })
    if (!quest) return res.status(404).json({ message: 'Quest not found' })
    if (quest.status !== 'active') return res.status(400).json({ message: 'Only active quests can be failed' })

    const now = new Date().toISOString()
    const dateKey = toDateKey(now)
    quest.status = 'failed'
    quest.failedAt = now
    await quest.save()

    const profile = await getProfileOrThrow(req.user._id)
    applyXpTransaction(profile, -quest.xp, { trackHistory: true, dateKey, historyPatch: { questsFailedDelta: 1 } })
    if (profile.focusQuestId === quest.questId) profile.focusQuestId = ''
    await profile.save()

    res.json({ message: 'Quest failed', quest, state: profile })
  } catch (error) {
    next(error)
  }
}
