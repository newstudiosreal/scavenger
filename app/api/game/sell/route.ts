import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId } = await req.json()
    const { data: itemInv, error: invError } = await supabase.from('inventory').select('id, quantity').eq('profile_id', userId).eq('item_id', itemId).eq('location', 'zaino').single()
    if (invError || !itemInv) return NextResponse.json({ error: 'Oggetto non trovato nello zaino' }, { status: 400 })
    const { data: itemData } = await supabase.from('items').select('base_price').eq('id', itemId).single()
    if (!itemData) return NextResponse.json({ error: 'Errore dati oggetto' }, { status: 500 })
    const { data: recentTxs } = await supabase.from('transactions').select('price').eq('item_id', itemId).order('created_at', { ascending: false }).limit(10)
    let finalPrice = itemData.base_//price
    if (recentTxs && recentTxs.length > 0) {
      const avg = recentTxs.reduce((acc: number, curr: any) => acc + curr.price, 0) / recentTxs.length
      finalPrice = Math.round(avg)
    }
    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single()
    await supabase.from('profiles').update({ coins: (profile?.coins || 0) + finalPrice }).eq('id', userId)
    if (itemInv.quantity > 1) {
      await supabase.from('inventory').update({ quantity: itemInv.quantity - 1 }).eq('id', itemInv.id)
    } else {
      await supabase.from('inventory').delete().eq('id', itemInv.id)
    }
    await supabase.from('transactions').insert({ buyer_id: null, seller_id: userId, item_id: itemId, quantity: 1, price: finalPrice })
    return NextResponse.json({ coinsEarned: finalPrice })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
