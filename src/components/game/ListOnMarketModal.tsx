'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function ListOnMarketModal({ item, onClose }: { item: any, onClose: () => void }) {
  const [price, setPrice] = useState(item.items?.base_price || 10)
  const [loading, setLoading] = useState(false)

  const handleList = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/game/list-market', {
      method: 'POST',
      body: JSON.stringify({ userId: user?.id, itemId: item.item_id, price: parseInt(price) }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      alert('Oggetto messo in vendita!')
      onClose()
    } else {
      alert('Errore durante la messa in vendita')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
        <h3 className="text-xl font-bold mb-4">Vendi al Mercato</h3>
        <div className="flex items-center gap-3 mb-6 p-3 bg-slate-700 rounded-xl">
          <span className="text-3xl">{item.items?.emoji_or_icon}</span>
          <p className="font-bold">{item.items?.name}</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Prezzo di vendita (coin)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors">Annulla</button>
          <button
            onClick={handleList}
            disabled={loading}
            className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Conferma'}
          </button>
        </div>
      </div>
    </div>
  )
}
