'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username } // This can be used by the trigger or a separate update
      }
    })

    if (error) alert(error.message)
    else {
      alert('Registrazione completata! Controlla la tua email per confermare.')
      router.push('/auth/login')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6">Crea Account</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              type="text"
              className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-green-600 hover:bg-green-500 transition-colors rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? 'Creazione...' : 'Registrati'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          Hai già un account? <a href="/login" className="text-green-400 hover:underline">Accedi</a>
        </p>
      </div>
    </div>
  )
}
