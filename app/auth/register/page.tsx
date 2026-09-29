'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
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
          <input type="text" placeholder="Username" className="w-full p-3 rounded bg-slate-700 border border-slate-600" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="email" placeholder="Email" className="w-full p-3 rounded bg-slate-700 border border-slate-600" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-3 rounded bg-slate-700 border border-slate-600" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full p-3 bg-green-600 rounded-lg font-bold"> {loading ? '...' : 'Registrati'} </button>
        </form>
        <p className="mt-4 text-center text-sm">Hai già un account? <a href="/auth/login" className="text-green-400">Accedi</a></p>
      </div>
    </div>
  )
}
