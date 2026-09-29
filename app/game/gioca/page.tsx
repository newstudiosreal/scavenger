'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, Zap, Package } from 'lucide-react'

export default function GiocaPage() {
  const [energy, setEnergy] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastItem, setLastItem] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      const { data } = await supabase.from('profiles').select('energy').eq('id', user.id).single()
      setEnergy(data?.energy ?? 0)
    }
    loadProfile()
  }, [router])

  const handleCollect = async () => {
    setLoading(true)
    setError(null)
    setLastItem(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch('/api/game/collect', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else {
      setLastItem(data.item)
      setEnergy(data.remainingEnergy)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="mb-8 bg-slate-800 p-6 rounded-full shadow-lg flex items-center gap-3 border-2 border-green-500">
        <Zap className="text-yellow-400 w-6 h-6" />
        <span className="text-2xl font-bold">Energia: {energy ?? '...'}</span>
      </div>
      <div className="relative w-64 h-64 mb-12 flex items-center justify-center bg-slate-800 rounded-full border-4 border-dashed border-slate-600">
        {lastItem ? (
          <div className="animate-bounce">
            <span className="text-8xl">{lastItem.emoji_or_icon}</span>
            <p className="mt-4 font-bold text-xl">{lastItem.name}</p>
          </div>
        ) : (
          <Package className="w-20 h-20 text-slate-600" />
        )}
      </div>
      {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg">{error}</div>}
      <button onClick={handleCollect} disabled={loading} className="group relative px-8 py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded-2xl font-black text-xl transition-all transform active:scale-95 shadow-xl">
        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'ESPLORA IL PARCO'}
      </button>
      <p className="mt-6 text-slate-400 text-sm">Consuma 1 energia per cercare oggetti.</p>
    </div>
  )
}
