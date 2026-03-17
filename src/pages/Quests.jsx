import { useEffect, useMemo, useState } from 'react'
import { Plus, ScrollText } from 'lucide-react'
import PomodoroTimer from '../components/PomodoroTimer'
import QuestCard from '../components/QuestCard'
import { useGame } from '../context/GameContext'
import { setLastAction } from '../utils/actionLog'
import { api } from '../utils/api'
import { getCurrentSnapshot, readString } from '../utils/storage'

const FOCUS_KEY = 'solo_leveling_focus_v1'

const emptyForm = {
  title: '',
  difficulty: 'Normal',
  category: 'General',
  questType: 'daily',
  notes: '',
  xp: 120,
  gold: 40,
  deadline: '',
}

function Quests() {
  const { syncFromBackend } = useGame()
  const [quests, setQuests] = useState([])
  const [focusId, setFocusId] = useState(() => readString(FOCUS_KEY, ''))
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')

  const loadQuests = async () => {
    const data = await api.get('/quests')
    setQuests((data.quests || []).map((quest) => ({ ...quest, id: quest.questId || quest.id })))
  }

  useEffect(() => {
    loadQuests().catch(() => {})
  }, [])

  const activeQuests = useMemo(() => quests.filter((quest) => quest.status === 'active'), [quests])
  const completedQuests = useMemo(() => quests.filter((quest) => quest.status === 'completed'), [quests])
  const failedQuests = useMemo(() => quests.filter((quest) => quest.status === 'failed'), [quests])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const snapshot = getCurrentSnapshot()
    if (editingId) await api.put(`/quests/${editingId}`, form)
    else await api.post('/quests', form)
    await syncFromBackend()
    await loadQuests()
    setLastAction({ type: 'restore_snapshot', snapshot })
    resetForm()
  }

  const handleComplete = async (id) => {
    const snapshot = getCurrentSnapshot()
    await api.patch(`/quests/${id}/complete`)
    await syncFromBackend()
    await loadQuests()
    if (focusId === id) setFocusId('')
    setLastAction({ type: 'restore_snapshot', snapshot })
  }

  const handleFail = async (id) => {
    const snapshot = getCurrentSnapshot()
    await api.patch(`/quests/${id}/fail`)
    await syncFromBackend()
    await loadQuests()
    if (focusId === id) setFocusId('')
    setLastAction({ type: 'restore_snapshot', snapshot })
  }

  const handleFocus = async (id) => {
    const nextFocus = focusId === id ? '' : id
    await api.patch(`/quests/${nextFocus || 'none'}/focus`)
    await syncFromBackend()
    await loadQuests()
    setFocusId(nextFocus)
  }

  const handleEdit = (quest) => {
    setEditingId(quest.id)
    setForm({
      title: quest.title || '',
      difficulty: quest.difficulty || 'Normal',
      category: quest.category || 'General',
      questType: quest.questType || 'daily',
      notes: quest.notes || '',
      xp: quest.xp || 120,
      gold: quest.gold || 40,
      deadline: quest.deadline || '',
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quest?')) return
    const snapshot = getCurrentSnapshot()
    await api.delete(`/quests/${id}`)
    await syncFromBackend()
    await loadQuests()
    if (focusId === id) setFocusId('')
    setLastAction({ type: 'restore_snapshot', snapshot })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Quest Board</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Custom Mission Board</h2>
            <p className="text-sm text-slate-300">Create your own daily, weekly, and one-time quests. Completing them gives XP and gold you can spend in rewards.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200">
            <ScrollText className="h-4 w-4 text-fuchsia-300" />
            {activeQuests.length} Active
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit Quest' : 'Add Quest'}</h3>
          {editingId ? <button type="button" onClick={resetForm} className="text-xs text-slate-400">Cancel edit</button> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Quest title" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" required />
          <input value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="Category" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <select value={form.difficulty} onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))} className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white">
            <option value="Easy">Easy</option>
            <option value="Normal">Normal</option>
            <option value="Hard">Hard</option>
          </select>
          <select value={form.questType} onChange={(event) => setForm((prev) => ({ ...prev, questType: event.target.value }))} className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="one-time">One-Time</option>
          </select>
          <input type="number" value={form.xp} onChange={(event) => setForm((prev) => ({ ...prev, xp: Number(event.target.value) }))} placeholder="XP reward" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <input type="number" value={form.gold} onChange={(event) => setForm((prev) => ({ ...prev, gold: Number(event.target.value) }))} placeholder="Gold reward" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <input type="date" value={form.deadline} onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))} className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-sm font-semibold text-fuchsia-100"><Plus className="h-4 w-4" />{editingId ? 'Update Quest' : 'Create Quest'}</button>
        </div>
        <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Optional notes" className="mt-3 h-24 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
      </form>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Active</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeQuests.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">No active quests right now. Add one above to start your next mission.</div>}
            {activeQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onComplete={handleComplete} onFail={handleFail} onFocus={handleFocus} onEdit={handleEdit} onDelete={handleDelete} isFocus={focusId === quest.id} allowArchive />)}
          </div>
        </div>

        <div className="space-y-4">
          <PomodoroTimer />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Completed</h3>
            <div className="mt-3 space-y-3">
              {completedQuests.length === 0 && <p className="text-sm text-slate-400">No completed quests yet.</p>}
              {completedQuests.map((quest) => <div key={quest.id} className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">{quest.title} • +{quest.xp} XP • +{quest.gold} G</div>)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Failed</h3>
            <div className="mt-3 space-y-3">
              {failedQuests.length === 0 && <p className="text-sm text-slate-400">No failed quests.</p>}
              {failedQuests.map((quest) => <div key={quest.id} className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">{quest.title}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quests
