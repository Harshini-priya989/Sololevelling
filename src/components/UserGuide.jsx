import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Flame, Gem, ShieldCheck, Sparkles, Swords, Timer } from 'lucide-react'

function GuideCard({ icon: Icon, title, description, accent, openLabel, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-4 text-left shadow-[0_0_18px_rgba(15,23,42,0.45)] transition hover:border-white/20"
    >
      <div
        className="absolute -right-10 -top-10 h-20 w-20 rounded-full blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="relative z-10 space-y-3">
        <Icon className="h-5 w-5 text-white/80" />
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cyan-200">
          Open {openLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  )
}

function FlowStep({ label, targetLabel, onOpen }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <span>{label}</span>
      <button type="button" onClick={onOpen} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-cyan-100 transition hover:bg-cyan-400/20">
        Open {targetLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

function UserGuide({ onNavigate = () => {} }) {
  const guideCards = [
    {
      icon: Swords,
      title: 'Quests',
      description: 'Add tasks with difficulty, deadline, XP, and Gold. Complete for rewards. Failures remove XP.',
      accent: 'rgba(217,70,239,0.4)',
      target: 'quests',
      openLabel: 'Quests',
    },
    {
      icon: Sparkles,
      title: 'Habits',
      description: 'Daily rituals give XP and build streaks. Missing a day resets that habit streak.',
      accent: 'rgba(56,189,248,0.4)',
      target: 'habits',
      openLabel: 'Habits',
    },
    {
      icon: Gem,
      title: 'Rewards',
      description: 'Spend Gold on real-life rewards. Gold never goes negative.',
      accent: 'rgba(251,191,36,0.4)',
      target: 'rewards',
      openLabel: 'Rewards',
    },
    {
      icon: Flame,
      title: 'Streaks',
      description: 'Habits fuel streak momentum. Sync streaks into the global player streak.',
      accent: 'rgba(248,113,113,0.4)',
      target: 'habits',
      openLabel: 'Habits',
    },
    {
      icon: Timer,
      title: 'Pomodoro',
      description: 'Focus sessions grant XP when completed. Breaks keep stamina high.',
      accent: 'rgba(99,102,241,0.4)',
      target: 'quests',
      openLabel: 'Quests',
    },
    {
      icon: ShieldCheck,
      title: 'Ranks',
      description: 'XP levels you up. Rank is determined by level from E to S.',
      accent: 'rgba(16,185,129,0.4)',
      target: 'profile',
      openLabel: 'Profile',
    },
  ]

  return (
    <section
      id="user-guide"
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(14,165,233,0.2)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">User Guide</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">How It Works</h3>
          <p className="text-sm text-slate-300">
            This system turns your day into a leveling loop. Every win matters.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200">
          <BookOpen className="h-4 w-4 text-cyan-300" />
          Read & Execute
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guideCards.map((card) => (
          <GuideCard key={card.title} icon={card.icon} title={card.title} description={card.description} accent={card.accent} openLabel={card.openLabel} onOpen={() => onNavigate(card.target)} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-white/10 bg-black/40 p-4"
        >
          <h4 className="text-lg font-semibold text-white">Core Rules</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              XP formula: <span className="mono">level * level * 100</span> for the next
              level.
            </li>
            <li>Complete quests to gain XP + Gold.</li>
            <li>Failing quests removes XP but never below Level 1.</li>
            <li>Habits give daily XP. Missing a day resets that habit streak.</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-black/40 p-4"
        >
          <h4 className="text-lg font-semibold text-white">Daily Flow</h4>
          <ol className="mt-3 space-y-2 text-sm text-slate-400">
            <FlowStep label="Start in Awakening: update Vision and Anti-Vision." targetLabel="Awakening" onOpen={() => onNavigate('awakening')} />
            <FlowStep label="Add Quests for the day and set difficulty." targetLabel="Quests" onOpen={() => onNavigate('quests')} />
            <FlowStep label="Use Pomodoro to focus on one quest at a time." targetLabel="Quests" onOpen={() => onNavigate('quests')} />
            <FlowStep label="Complete habits before the day ends to protect streaks." targetLabel="Habits" onOpen={() => onNavigate('habits')} />
            <FlowStep label="Review Gates (Dashboard) and spend Gold in Rewards." targetLabel="Rewards" onOpen={() => onNavigate('rewards')} />
          </ol>
        </motion.div>
      </div>
    </section>
  )
}

export default UserGuide
