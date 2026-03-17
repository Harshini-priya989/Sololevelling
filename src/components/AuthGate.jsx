import { useState } from 'react'
import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function AuthGate() {
  const { signIn, signUp, authError } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (mode === 'register') {
        await signUp({ username: form.username.trim(), email: form.email.trim(), password: form.password })
      } else {
        await signIn({ email: form.email.trim(), password: form.password })
      }
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060c]/90 px-4">
      <div className="w-full max-w-md rounded-3xl border border-fuchsia-400/30 bg-black/70 p-6 shadow-[0_0_40px_rgba(168,85,247,0.45)] backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-fuchsia-300/80">Hunter Access</p>
          <h2 className="text-2xl font-semibold text-white">{mode === 'register' ? 'Create Account' : 'Sign In'}</h2>
          <p className="text-sm text-slate-300">Use your own account so this app works for any user on any laptop.</p>
        </div>

        <div className="mt-5 flex rounded-full border border-white/10 bg-black/40 p-1">
          <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${mode === 'login' ? 'bg-fuchsia-500/20 text-fuchsia-100' : 'text-slate-400'}`}>Login</button>
          <button type="button" onClick={() => setMode('register')} className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${mode === 'register' ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400'}`}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><UserRound className="h-3.5 w-3.5" />Username</span>
              <input type="text" value={form.username} onChange={(event) => updateField('username', event.target.value)} required className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400/70 focus:outline-none" placeholder="hunter_name" />
            </label>
          )}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Mail className="h-3.5 w-3.5" />Email</span>
            <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-fuchsia-400/70 focus:outline-none" placeholder="you@example.com" />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><LockKeyhole className="h-3.5 w-3.5" />Password</span>
            <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} required className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-fuchsia-400/70 focus:outline-none" placeholder="Strong password" />
          </label>

          {(error || authError) && <p className="text-center text-xs text-rose-300">{error || authError}</p>}

          <button type="submit" disabled={submitting} className="w-full rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-100 transition hover:bg-fuchsia-500/30 disabled:opacity-60">
            {submitting ? 'Processing' : mode === 'register' ? 'Create Account' : 'Enter System'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthGate
