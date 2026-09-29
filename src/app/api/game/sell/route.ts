import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId } = await req.json()

    // 1. Verify item exists in backpack
    const { data: itemInv, error: invError } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('profile_id', userId)
      .eq('item_id', itemId)
      .eq('location', 'zaino')
      .single()

    if (invError || !itemInv) return NextResponse.json({ error: 'Oggetto non trovato nello zaino' }, { status: 400 })

    // 2. Get item base price
    const { data: itemData } = await supabase.from('items').select('base_price').eq('id', itemId).single()
    if (!itemData) return NextResponse.json({ error: 'Errore dati oggetto' }, { status: 500 })

    // 3. Dynamic Price Calculation (Phase 1 Requirement)
    // Calculate average price of last 10 transactions for this item
    const { data: recentTxs } = await supabase
      .from('transactions')
      .select('price')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(10)

    let finalPrice = itemData.base_price
    if (recentTxs && recentTxs.length > 0) {
      const avg = recentTxs.reduce((acc: number, curr: any) => acc + curr.price, 0) / recentTxs.length
      finalPrice = Math.round(avg)
    }

    // 4. Update Profile Coins and remove item
    await supabase.rpc('increment_coins', { user_id: userId, amount: finalPrice })
    // Note: I'll define this RPC in a moment, but for now I'll use a simple update for logic flow

    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single()
    await supabase.from('profiles').update({ coins: (profile?.coins || 0) + finalPrice }).eq('id', userId)

    if (itemInv.quantity > 1) {
      await supabase.from('inventory').update({ quantity: itemInv.quantity - 1 }).eq('id', itemInv.id)
    } else {
      await supabase.from('inventory').delete().eq('id', itemInv.id)
    }

    // 5. Record transaction
    await supabase.from('transactions').insert({
      buyer_id: null, // Sold to base
      seller_id: userId,
      item_id: itemId,
      quantity: 1,
      price: finalPrice
    })

    return NextResponse.json({ coinsEarned: finalPrice })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
