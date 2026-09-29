import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId, price } = await req.json()
    const { data: itemInv, error: invError } = await supabase.from('inventory').select('id').eq('profile_id', userId).eq('item_id', itemId).eq('location', 'zaino').single()
    if (invError || !itemInv) return NextResponse.json({ error: 'Oggetto non trovato nello zaino' }, { status: 400 })
    const { error: listError } = await supabase.from('market_listings').insert({ seller_id: userId, item_id: itemId, price: price, status: 'attivo' })
    if (listError) throw listError
    await supabase.from('inventory').delete().eq('id', itemInv.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.//message }, { status: 500 })
  }
}
