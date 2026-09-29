import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userId, itemId, price } = await req.json()
    if (!userId || !itemId || !price) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const { data: item, error: itemError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', itemId)
      .single()

    if (itemError || !item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const { error: listError } = await supabase
      .from('market_listings')
      .insert({
        seller_id: userId,
        item_name: item.item_name,
        emoji: item.emoji,
        rarity: item.rarity,
        base_value: item.base_value,
        price: price
      })
    if (listError) throw listError

    const { error: delError } = await supabase.from('inventory').delete().eq('id', itemId)
    if (delError) throw delError

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
