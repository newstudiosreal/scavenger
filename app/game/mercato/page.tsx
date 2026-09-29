'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Coins, Package, ArrowLeft } from 'lucide-react'

export default function MercatoPage() {
  const [listings, setListings] = useState<any[]>([])
  const [coins, setCoins] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase.from('profiles').select('coins').eq('id', user.id).single()
      const { data: items } = await supabase.from('market_listings').select('*').neq('seller_id', user.id)

      setCoins(profile?.coins ?? 0)
      setListings(items ?? [])
      setLoading(false)
    }
    loadData()
  }, [router])

  const handleBuy = async (listing: any) => {
    const res = await fetch('/api/game/buy', {
      method: 'POST',
      body: JSON.stringify({ listingId: listing.id }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      const data = await res.json()
      setCoins(data.newBalance)
      setListings(prev => prev.filter(l => l.id !== listing.id))
    } else {
      const err = await res.json()
      alert(err.error || 'Errore durante l\'acquisto')
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Caricamento Mercato...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <header className="flex justify-between items-center mb-8">
        <button onClick={() => router.push('/game/base')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna alla Base
        </button>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-yellow-500">
          <Coins className="text-yellow-400 w-5 h-5" />
          <span className="font-bold">{coins} Monete</span>
        </div>
      </header>

      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <ShoppingCart className="w-8 h-8 text-purple-400" /> Mercato P2P
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.length === 0 && <p className="col-span-full text-center text-slate-400 py-12">Nessun oggetto in vendita al momento.</p>}
        {listings.map(listing => (
          <div key={listing.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl bg-slate-700 p-3 rounded-xl">{listing.emoji}</span>
              <div>
                <p className="font-bold text-lg">{listing.item_name}</p>
                <p className="text-xs text-slate-400 uppercase">{listing.rarity}</p>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xl font-black text-yellow-400">{listing.price} 🪙</span>
              <button
                onClick={() => handleBuy(listing)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors"
              >
                Compra
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
