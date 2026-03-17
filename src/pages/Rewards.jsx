import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Gem, Gift, Plus, ShieldCheck } from 'lucide-react'
import RewardCard from '../components/RewardCard'
import { useGame } from '../context/GameContext'
import { setLastAction } from '../utils/actionLog'
import { api } from '../utils/api'
import { getCurrentSnapshot } from '../utils/storage'

const emptyForm = {
  title: '',
  description: '',
  category: 'Lifestyle',
  cost: 100,
  cooldownDays: 1,
}

const getCooldownInfo = (reward) => {
  if (!reward.lastRedeemedAt) return { onCooldown: false, label: '' }
  const cooldownMs = (reward.cooldownDays || 1) * 24 * 60 * 60 * 1000
  const nextAvailable = new Date(reward.lastRedeemedAt).getTime() + cooldownMs
  const remaining = nextAvailable - Date.now()
  if (remaining <= 0) return { onCooldown: false, label: '' }
  const hours = Math.ceil(remaining / (1000 * 60 * 60))
  return { onCooldown: true, label: `${hours}h` }
}

function Rewards() {
  const { gold, syncFromBackend } = useGame()
  const [rewards, setRewards] = useState([])
  const [rewardLog, setRewardLog] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')

  const loadRewards = async () => {
    const data = await api.get('/rewards')
    setRewards((data.rewards || []).map((reward) => ({ ...reward, id: reward.rewardId || reward.id })))
    setRewardLog(data.rewardLog || [])
  }

  useEffect(() => {
    loadRewards().catch(() => {})
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const snapshot = getCurrentSnapshot()
    if (editingId) await api.put(`/rewards/${editingId}`, form)
    else await api.post('/rewards', form)
    await syncFromBackend()
    await loadRewards()
    setLastAction({ type: 'restore_snapshot', snapshot })
    resetForm()
  }

  const handleRedeem = async (id) => {
    const snapshot = getCurrentSnapshot()
    await api.post(`/rewards/${id}/redeem`)
    await syncFromBackend()
    await loadRewards()
    setLastAction({ type: 'restore_snapshot', snapshot })
  }

  const handleEdit = (reward) => {
    setEditingId(reward.id)
    setForm({
      title: reward.title || '',
      description: reward.description || '',
      category: reward.category || 'Lifestyle',
      cost: reward.cost || 100,
      cooldownDays: reward.cooldownDays || 1,
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reward?')) return
    const snapshot = getCurrentSnapshot()
    await api.delete(`/rewards/${id}`)
    await syncFromBackend()
    await loadRewards()
    setLastAction({ type: 'restore_snapshot', snapshot })
  }

  const claimedRewards = useMemo(() => rewards.filter((reward) => reward.redeemCount), [rewards])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Reward Vault</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Custom Rewards</h2>
            <p className="text-sm text-slate-300">Build your own reward store. Finish quests, earn gold, and spend that gold only on rewards you define here.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            <Gem className="h-4 w-4" />
            {gold} Gold
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Redemption Rules
          </div>
          <ul className="mt-3 text-sm text-slate-400">
            <li>Quests give gold. Gold buys rewards.</li>
            <li>Gold never goes negative.</li>
            <li>Use rewards to recharge, not to derail momentum.</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit Reward' : 'Add Reward'}</h3>
          {editingId ? <button type="button" onClick={resetForm} className="text-xs text-slate-400">Cancel edit</button> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Reward title" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" required />
          <input value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="Category" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <input type="number" value={form.cost} onChange={(event) => setForm((prev) => ({ ...prev, cost: Number(event.target.value) }))} placeholder="Gold cost" className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
          <div className="flex gap-3">
            <input type="number" value={form.cooldownDays} onChange={(event) => setForm((prev) => ({ ...prev, cooldownDays: Number(event.target.value) }))} placeholder="Cooldown days" className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100"><Plus className="h-4 w-4" />{editingId ? 'Update' : 'Create'}</button>
          </div>
        </div>
        <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Optional description" className="mt-3 h-24 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white" />
      </form>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {rewards.map((reward) => {
            const cooldown = getCooldownInfo(reward)
            return <RewardCard key={reward.id} reward={reward} canRedeem={gold >= reward.cost} onRedeem={handleRedeem} onCooldown={cooldown.onCooldown} cooldownLabel={cooldown.label} onEdit={handleEdit} onDelete={handleDelete} />
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Claimed Rewards</h3>
            <Gift className="h-4 w-4 text-amber-200" />
          </div>
          {claimedRewards.length === 0 && <p className="text-sm text-slate-400">No rewards claimed yet.</p>}
          <div className="space-y-2 text-sm text-slate-300">
            {claimedRewards.map((reward) => <div key={reward.id} className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">{reward.title} - {reward.redeemCount || 0}x</div>)}
          </div>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold text-white">Redemption Log</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-400">
          {rewardLog.length === 0 && <p>No redemptions yet.</p>}
          {rewardLog.slice(0, 8).map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-300"><span>{entry.title}</span><span>{entry.cost} G - {entry.at?.slice(0, 10)}</span></div>)}
        </div>
      </div>
    </div>
  )
}

export default Rewards
