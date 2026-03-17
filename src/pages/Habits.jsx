import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, CheckCircle2, Flame, Pencil, Plus, Trash2 } from 'lucide-react'
import HabitHeatmap from '../components/HabitHeatmap'
import { useGame } from '../context/GameContext'
import { setLastAction } from '../utils/actionLog'
import { api } from '../utils/api'
import { getCurrentSnapshot } from '../utils/storage'

const emptyForm = { title: '', xpReward: 25, xpPenalty: 0, category: 'General', notes: '' }

const buildHeatmapDays = (entries) => {
  const days = []
  for (let i = 34; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().slice(0, 10)
    days.push({ date: key, count: entries[key] || 0 })
  }
  return days
}

const getStreakBadge = (streak = 0) => {
  if (streak >= 30) return { label: 'Monarch', tone: 'border-amber-400/40 bg-amber-400/10 text-amber-100' }
  if (streak >= 14) return { label: 'Shadow Disciple', tone: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100' }
  if (streak >= 7) return { label: 'Iron Will', tone: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100' }
  if (streak >= 3) return { label: 'Rising', tone: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' }
  return { label: 'Novice', tone: 'border-white/10 bg-white/5 text-slate-300' }
}

function Habits() {
  const { syncFromBackend, syncHabitStreak } = useGame()
  const [habits, setHabits] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')

  const loadHabits = async () => {
    const data = await api.get('/habits')
    setHabits((data.habits || []).map((habit) => ({ ...habit, id: habit.habitId || habit.id })))
  }

  useEffect(() => { loadHabits().catch(() => {}) }, [])

  const combinedStreak = useMemo(() => habits.reduce((total, habit) => total + (habit.streak || 0), 0), [habits])
  const globalHeatmap = useMemo(() => {
    const entries = {}
    habits.forEach((habit) => Object.entries(habit.history || {}).forEach(([date, count]) => { entries[date] = (entries[date] || 0) + count }))
    return buildHeatmapDays(entries)
  }, [habits])

  const resetForm = () => { setForm(emptyForm); setEditingId('') }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const snapshot = getCurrentSnapshot()
    if (editingId) await api.put(`/habits/${editingId}`, form)
    else await api.post('/habits', form)
    await syncFromBackend()
    await loadHabits()
    setLastAction({ type: 'restore_snapshot', snapshot })
    resetForm()
  }

  const completeHabit = async (habitId) => {
    const snapshot = getCurrentSnapshot()
    await api.patch(`/habits/${habitId}/complete`)
    await syncFromBackend()
    await loadHabits()
    setLastAction({ type: 'restore_snapshot', snapshot })
  }

  const handleDelete = async (habitId) => {
    if (!window.confirm('Delete this habit?')) return
    const snapshot = getCurrentSnapshot()
    await api.delete(`/habits/${habitId}`)
    await syncFromBackend()
    await loadHabits()
    setLastAction({ type: 'restore_snapshot', snapshot })
  }

  const handleEdit = (habit) => {
    setEditingId(habit.id)
    setForm({ title: habit.title || '', xpReward: habit.xpReward || 25, xpPenalty: habit.xpPenalty || 0, category: habit.category || 'General', notes: habit.notes || '' })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Habit Engine</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Daily Rituals</h2>
            <p className="text-sm text-slate-300">Build your own habits, keep streaks alive, and unlock stronger streak badges.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200"><Flame className="h-4 w-4 text-rose-300" />{combinedStreak} Total Streak</div>
        </div>
        <div className="mt-6"><HabitHeatmap days={globalHeatmap} /></div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold text-white">{editingId ? 'Edit Habit' : 'Add Habit'}</h3>{editingId ? <button type="button" onClick={resetForm} className="text-xs text-slate-400">Cancel edit</button> : null}</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Habit title" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" required />
          <input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="Category" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <input type="number" value={form.xpReward} onChange={(e) => setForm((prev) => ({ ...prev, xpReward: Number(e.target.value) }))} placeholder="XP reward" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <input type="number" value={form.xpPenalty} onChange={(e) => setForm((prev) => ({ ...prev, xpPenalty: Number(e.target.value) }))} placeholder="XP penalty" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100"><Plus className="h-4 w-4" />{editingId ? 'Update Habit' : 'Create Habit'}</button>
        </div>
        <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Optional notes" className="mt-3 h-24 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
      </form>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit) => {
            const badge = getStreakBadge(habit.streak)
            return (
              <motion.div key={habit.id} whileHover={{ y: -4 }} className="rounded-2xl border border-white/10 bg-black/50 p-4 shadow-[0_0_18px_rgba(15,23,42,0.45)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
                    <p className="text-xs text-slate-400">{habit.category || 'General'} | Reward {habit.xpReward} XP | Penalty {habit.xpPenalty || 0} XP</p>
                    {habit.notes ? <p className="mt-2 text-sm text-slate-400">{habit.notes}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">{habit.streak} streak</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.25em] ${badge.tone}`}><Award className="h-3 w-3" />{badge.label}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>Last done: {habit.lastCompleted || 'Never'}</span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => completeHabit(habit.id)} className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"><CheckCircle2 className="h-3 w-3" />Mark Done</button>
                    <button type="button" onClick={() => handleEdit(habit)} className="flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100"><Pencil className="h-3 w-3" />Edit</button>
                    <button type="button" onClick={() => handleDelete(habit.id)} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"><Trash2 className="h-3 w-3" />Delete</button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Streak Sync</h3>
            <p className="mt-2 text-sm text-slate-400">Sync combined habit streak into your global player streak.</p>
            <button type="button" onClick={syncHabitStreak} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/20"><Flame className="h-4 w-4" />Sync Streak</button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Badge Ladder</h3>
            <ul className="mt-3 text-sm text-slate-400">
              <li>Novice: 0-2 day streak</li>
              <li>Rising: 3+ day streak</li>
              <li>Iron Will: 7+ day streak</li>
              <li>Shadow Disciple: 14+ day streak</li>
              <li>Monarch: 30+ day streak</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Habits
