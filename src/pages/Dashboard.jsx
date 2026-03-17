import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarDays, Crown, Flame, Gem, ShieldCheck } from 'lucide-react'
import HabitHeatmap from '../components/HabitHeatmap'
import PlayerStats from '../components/PlayerStats'
import UserGuide from '../components/UserGuide'
import { useGame } from '../context/GameContext'
import { clearLastAction, getLastAction } from '../utils/actionLog'
import { api } from '../utils/api'
import { hydrateSnapshotLocally, readStorage, readString } from '../utils/storage'

const cardVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

function InfoCard({ label, value, caption, icon: Icon, accent }) {
  return (
    <motion.div variants={cardVariants} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_18px_rgba(15,23,42,0.45)]">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl" style={{ backgroundColor: accent }} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-2 text-xl font-semibold text-white">{value}</p>
          {caption && <p className="mt-1 text-xs text-slate-400">{caption}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2"><Icon className="h-5 w-5 text-white/80" /></div>
      </div>
    </motion.div>
  )
}

function Dashboard({ onNavigate = () => {} }) {
  const { level, rank, gold, streak, syncFromBackend } = useGame()
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const [activityRange, setActivityRange] = useState('weekly')
  const [activityData, setActivityData] = useState({ weekly: [], monthly: [], heatmap: [] })
  const fileInputRef = useRef(null)

  const buildActivityData = () => {
    const quests = readStorage('solo_leveling_quests_v1', [])
    const habits = readStorage('solo_leveling_habits_v1', [])
    const questTotals = {}
    const habitTotals = {}

    quests.filter((quest) => quest.status === 'completed').forEach((quest) => {
      const date = (quest.completedAt || quest.updatedAt || quest.createdAt || '').slice(0, 10) || null
      if (!date) return
      if (!questTotals[date]) questTotals[date] = { count: 0, xp: 0 }
      questTotals[date].count += 1
      questTotals[date].xp += Number(quest.xp) || 0
    })

    habits.forEach((habit) => {
      const xpReward = Number(habit.xpReward) || 25
      Object.entries(habit.history || {}).forEach(([date, count]) => {
        const times = Number(count) || 0
        if (!times) return
        if (!habitTotals[date]) habitTotals[date] = { count: 0, xp: 0 }
        habitTotals[date].count += times
        habitTotals[date].xp += times * xpReward
      })
    })

    const buildDays = (length, getLabel) => Array.from({ length }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (length - 1 - index))
      const key = date.toISOString().slice(0, 10)
      const quest = questTotals[key] || { count: 0, xp: 0 }
      const habit = habitTotals[key] || { count: 0, xp: 0 }
      return { day: getLabel(date, index), xp: quest.xp + habit.xp, quests: quest.count, habits: habit.count, key }
    })

    const weekly = buildDays(7, (date) => date.toLocaleDateString('en-US', { weekday: 'short' }))
    const monthlyBuckets = Array.from({ length: 4 }, (_, index) => ({ day: `W${index + 1}`, xp: 0, quests: 0, habits: 0 }))
    const monthlyDays = buildDays(28, () => '')
    monthlyDays.forEach((entry, index) => {
      const bucket = monthlyBuckets[Math.floor(index / 7)]
      if (!bucket) return
      bucket.xp += entry.xp
      bucket.quests += entry.quests
      bucket.habits += entry.habits
    })

    const heatmap = buildDays(35, (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).map((entry) => ({ date: entry.key, count: entry.quests + entry.habits }))

    setActivityData({ weekly, monthly: monthlyBuckets, heatmap })
  }

  const activeData = useMemo(() => (activityRange === 'monthly' ? activityData.monthly : activityData.weekly), [activityData, activityRange])

  useEffect(() => {
    buildActivityData()
    const lastAction = getLastAction()
    if (lastAction?.type === 'restore_snapshot') {
      hydrateSnapshotLocally(lastAction.snapshot)
      clearLastAction()
      syncFromBackend().catch(() => {})
      buildActivityData()
    }
  }, [syncFromBackend])

  const handleExport = async () => {
    const data = await api.get('/game/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `solo-leveling-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await api.post('/game/import', JSON.parse(text))
    await syncFromBackend()
    buildActivityData()
    event.target.value = ''
  }

  const handleHardReset = async () => {
    if (!window.confirm('Hard reset your entire account progress? This cannot be undone.')) return
    await api.post('/game/reset')
    await syncFromBackend()
    buildActivityData()
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Today" value={todayLabel} caption="Current battlefield" icon={CalendarDays} accent="rgba(34,211,238,0.25)" />
        <InfoCard label="Level" value={level} caption={`Rank ${rank}`} icon={Crown} accent="rgba(168,85,247,0.25)" />
        <InfoCard label="Gold" value={gold} caption="Spend in reward vault" icon={Gem} accent="rgba(251,191,36,0.28)" />
        <InfoCard label="Streak" value={streak} caption="Momentum sync" icon={Flame} accent="rgba(248,113,113,0.28)" />
      </section>

      <PlayerStats onExport={handleExport} onImportClick={() => fileInputRef.current?.click()} onReset={handleHardReset} />
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <motion.div variants={cardVariants} initial="initial" animate="animate" className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(124,58,237,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Activity Grid</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">XP Flow</h3>
              <p className="text-sm text-slate-300">Track how your quests and habits stack XP across time.</p>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1 text-xs">
              {['weekly', 'monthly'].map((range) => (
                <button key={range} type="button" onClick={() => setActivityRange(range)} className={`rounded-full px-3 py-1 uppercase tracking-[0.3em] transition ${activityRange === range ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeData}>
                <defs>
                  <linearGradient id="xpGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.65} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(148,163,184,0.65)" axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(148,163,184,0.65)" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#050816', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }} labelStyle={{ color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="xp" stroke="#a855f7" fill="url(#xpGlow)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="initial" animate="animate" transition={{ delay: 0.05 }} className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(34,197,94,0.16)]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Consistency Matrix</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Streak Heatmap</h3>
            <p className="text-sm text-slate-300">Every quest and habit completion leaves a signal on the grid.</p>
          </div>
          <div className="mt-6">
            <HabitHeatmap days={activityData.heatmap} />
          </div>
          <div className="mt-6 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(148,163,184,0.65)" axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(148,163,184,0.65)" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#050816', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }} labelStyle={{ color: '#e2e8f0' }} />
                <Bar dataKey="quests" fill="#22d3ee" radius={[12, 12, 0, 0]} />
                <Bar dataKey="habits" fill="#f472b6" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300"><ShieldCheck className="h-4 w-4 text-emerald-300" />Undo and backups live above in Player Stats.</div>
        </motion.div>
      </section>

      <UserGuide onNavigate={onNavigate} />
    </div>
  )
}

export default Dashboard
