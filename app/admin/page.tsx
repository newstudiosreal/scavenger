'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Users, Database, TrendingUp, ArrowLeft } from 'lucide-react'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadAdminData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'superadmin') {
        alert('Accesso negato')
        router.push('/base')
        return
      }

      // Global stats
      const { data: allPlayers } = await supabase.from('profiles').select('*')
      const { data: allTxs } = await supabase.from('transactions').select('price')

      const totalCoins = allPlayers?.reduce((acc: number, p: any) => acc + p.coins, 0) || 0
      const totalVolume = allTxs?.reduce((acc: number, t: any) => acc + t.price, 0) || 0

      setPlayers(allPlayers || [])
      setStats({ totalCoins, totalVolume, playerCount: allPlayers?.length || 0 })
      setLoading(false)
    }
    loadAdminData()
  }, [router])

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Caricamento...</div>

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-white">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.push('/base')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna alla Base
        </button>
        <div className="bg-red-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">SuperAdmin Panel</div>
      </div>

      <h1 className="text-4xl font-black mb-8">PANNELLO DI CONTROLLO</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <Users className="text-blue-400 mb-2" />
          <p className="text-slate-400 text-sm">Giocatori Totali</p>
          <p className="text-3xl font-bold">{stats?.playerCount}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <Database className="text-yellow-400 mb-2" />
          <p className="text-slate-400 text-sm">Coin in Circolazione</p>
          <p className="text-3xl font-bold">{stats?.totalCoins}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <TrendingUp className="text-green-400 mb-2" />
          <p className="text-slate-400 text-sm">Volume Transazioni</p>
          <p className="text-3xl font-bold">{stats?.totalVolume}</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold">Lista Giocatori</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-400 text-sm">
            <tr>
              <th className="p-4">Username</th>
              <th className="p-4">Ruolo</th>
              <th className="p-4">Coin</th>
              <th className="p-4">Energia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 font-medium">{p.username}</td>
                <td className="p-4"><span className="px-2 py-1 bg-slate-700 rounded text-xs">{p.role}</span></td>
                <td className="p-4 font-bold text-yellow-400">{p.coins}</td>
                <td className="p-4">{p.energy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
