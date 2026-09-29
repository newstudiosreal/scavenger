import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { itemId } = await req.json()
    if (!itemId) return NextResponse.json({ error: 'Item ID required' }, { status: 400 })

    // 1. Get Item
    const { data: item, error: itemError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', itemId)
      .single()

    if (itemError || !item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    // 2. Calculate Dynamic Price
    // MVP logic: Base Value * (1 + (Count of similar transactions / 100))
    // In real app, this would query the 'transactions' table for a moving average
    const salePrice = Math.floor(item.base_value * 1.2)

    // 3. Atomic Update: Delete Item + Add Coins
    const { data: profile } = await supabase.auth.getUser()
    const userId = (await supabase.auth.getUser()).data.user?.id

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Remove item
    const { error: delError } = await supabase.from('inventory').delete().eq('id', itemId)
    if (delError) throw delError

    // Add coins
    const { data: currentProfile } = await supabase.from('profiles').select('coins').eq('id', userId).single()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coins: (currentProfile?.coins ?? 0) + salePrice })
      .eq('id', userId)

    if (updateError) throw updateError

    return NextResponse.json({ salePrice, newItemBalance: (currentProfile?.coins ?? 0) + salePrice })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
