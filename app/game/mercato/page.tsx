'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Coins, ArrowLeft } from 'lucide-react'

export default function MercatoPage() {
  const [listings, setListings] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: lists } = await supabase.from('market_listings').select('*, items(name, emoji_or_icon)').eq('status', 'attivo').order('created_at', { ascending: false })
      setListings(lists || [])
    }
    loadData()
  }, [router])

  const handleBuy = async (listingId: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/game/buy', {
      method: 'POST',
      body: JSON.stringify({ buyerId: user?.id, listingId }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (res.ok) {
      alert('Acquisto riuscito!')
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
      setProfile(prof)
      const { data: lists } = await supabase.from('market_listings').select('*, items(name, emoji_or_icon)').eq('status', 'attivo')
      setListings(lists || [])
    } else {
      alert(data.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-6 bg-slate-900 text-white">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.push('/game/base')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna alla Base
        </button>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-yellow-500/50">
          <Coins className="text-yellow-400 w-5 h-5" />
          <span className="font-bold">{profile?.coins ?? 0}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="text-green-500 w-8 h-8" />
        <h1 className="text-3xl font-black">MERCATO</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.length === 0 ? <p className="col-span-full text-center text-slate-500 py-12">Nessun oggetto in vendita.</p> : (
          listings.map((item) => (
            <div key={item.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.items?.emoji_or_icon}</span>
                <div><p className="font-bold">{item.items?.name}</p><p className="text-green-400 font-bold">{item.price} coin</p></div>
              </div>
              <button onClick={() => handleBuy(item.id)} disabled={loading} className="px-4 py-2 bg-green-600 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">Compra</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
