import { GameProfile } from '../models/GameProfile.js'
import { Quest } from '../models/Quest.js'
import { applyGoldTransaction, applyXpTransaction, getProfileOrThrow } from '../services/gameStateService.js'
import { toDateKey } from '../services/gameMath.js'

export const getQuests = async (req, res, next) => {
  try {
    const quests = await Quest.find({ user: req.user._id }).sort({ createdAt: 1 }).lean()
    res.json({ quests })
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
