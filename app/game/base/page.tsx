'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Coins, Home, ShoppingCart, ArrowLeft, Package } from 'lucide-react'
import { ListOnMarketModal } from '@/components/game/ListOnMarketModal'

export default function BasePage() {
  const [profile, setProfile] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [listingItem, setListingItem] = useState<any>(null)
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

      const { data: inv } = await supabase
        .from('inventory')
        .select('*, items(name, emoji_or_icon, base_price)')
        .eq('profile_id', user.id)
        .eq('location', 'zaino')

      setInventory(inv || [])
    }
    loadData()
  }, [router])

  const handleSell = async (itemId: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/game/sell', {
      method: 'POST',
      body: JSON.stringify({ userId: user?.id, itemId }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
      setProfile(prof)
      const { data: inv } = await supabase.from('inventory').select('*, items(name, emoji_or_icon, base_price)').eq('profile_id', user?.id).eq('location', 'zaino')
      setInventory(inv || [])
    } else {
      alert('Errore durante la vendita')
    }
    setLoading(false)
  }

  const handleDeposit = async (itemId: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/game/deposit', {
      method: 'POST',
      body: JSON.stringify({ userId: user?.id, itemId }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      const { data: inv } = await supabase.from('inventory').select('*, items(name, emoji_or_icon, base_price)').eq('profile_id', user?.id).eq('location', 'zaino')
      setInventory(inv || [])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-6 bg-slate-900 text-white">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.push('/game/gioca')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna a esplorare
        </button>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-yellow-500/50">
          <Coins className="text-yellow-400 w-5 h-5" />
          <span className="font-bold">{profile?.coins ?? 0}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Home className="text-green-500 w-8 h-8" />
        <h1 className="text-3xl font-black">LA TUA BASE</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" /> Zaino ({inventory.length}/{profile?.backpack_capacity ?? 10})
          </h2>

          {inventory.length === 0 ? (
            <p className="text-slate-500 italic">Lo zaino è vuoto. Vai a raccogliere oggetti!</p>
          ) : (
            <div className="space-y-3">
              {inventory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700 rounded-xl border border-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.items?.emoji_or_icon}</span>
                    <div>
                      <p className="font-bold">{item.items?.name}</p>
                      <p className="text-xs text-slate-400">Prezzo base: {item.items?.base_price} coin</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSell(item.item_id)}
                      disabled={loading}
                      className="p-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-xs font-bold transition-colors"
                    >
                      Vendi
                    </button>
                    <button
                      onClick={() => handleDeposit(item.item_id)}
                      disabled={loading}
                      className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors"
                    >
                      Deposita
                    </button>
                    <button
                      onClick={() => setListingItem(item)}
                      disabled={loading}
                      className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold transition-colors"
                    >
                      Mercato
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Mercato tra Giocatori</h2>
          <p className="text-slate-400 mb-6">Vendi i tuoi oggetti rari ad altri esploratori per guadagnare di più!</p>
          <button
            onClick={() => router.push('/game/mercato')}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all"
          >
            Vai al Mercato
          </button>
        </div>
      </div>

      {listingItem && (
        <ListOnMarketModal
          item={listingItem}
          onClose={() => setListingItem(null)}
        />
      )}
    </div>
  )
}
