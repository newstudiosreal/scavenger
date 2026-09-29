'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Package, Coins, Store, TrendingUp } from 'lucide-react'

export default function BasePage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [coins, setCoins] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase.from('profiles').select('coins').eq('id', user.id).single()
      const { data: items } = await supabase.from('inventory').select('*').eq('user_id', user.id)

      setCoins(profile?.coins ?? 0)
      setInventory(items ?? [])
      setLoading(false)
    }
    loadData()
  }, [router])

  const handleSell = async (item: any) => {
    const res = await fetch('/api/game/sell', {
      method: 'POST',
      body: JSON.stringify({ itemId: item.id }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      const data = await res.json()
      setCoins(prev => (prev ?? 0) + data.salePrice)
      setInventory(prev => prev.filter(i => i.id !== item.id))
    } else {
      alert('Errore durante la vendita')
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">La tua Base</h1>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-yellow-500">
          <Coins className="text-yellow-400 w-5 h-5" />
          <span className="font-bold">{coins} Monete</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" /> Inventario
          </h2>
          <div className="space-y-3">
            {inventory.length === 0 && <p className="text-slate-400">Nessun oggetto trovato.</p>}
            {inventory.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-bold">{item.item_name}</p>
                    <p className="text-xs text-slate-400">{item.rarity}</p>
                  </div>
                </div>
                <button onClick={() => handleSell(item)} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-bold transition-colors">
                  Vendi
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" /> Azioni Rapide
          </h2>
          <div className="space-y-4">
            <button onClick={() => router.push('/game/gioca')} className="w-full p-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all">
              Vai a Esplorare
            </button>
            <button onClick={() => router.push('/game/mercato')} className="w-full p-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-all">
              Apri Mercato P2P
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
