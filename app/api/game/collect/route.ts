import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    // 1. Check Energy
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('energy')
      .eq('id', userId)
      .single()

    if (profileError || !profile || profile.energy < 1) {
      return NextResponse.json({ error: 'Not enough energy!' }, { status: 400 })
    }

    // 2. Generate Random Item (Simplified for MVP)
    // In a real app, we'd fetch available items from the 'items' table
    const lootTable = [
      { name: 'Old Coin', emoji: '🪙', rarity: 'common', value: 10 },
      { name: 'Rusty Key', emoji: '🔑', rarity: 'common', value: 15 },
      { name: 'Strange Crystal', emoji: '💎', rarity: 'rare', value: 100 },
      { name: 'Ancient Scroll', emoji: '📜', rarity: 'rare', value: 80 },
      { name: 'Golden Idol', emoji: '🗿', rarity: 'legendary', value: 500 },
    ]
    const randomItem = lootTable[Math.floor(Math.random() * lootTable.length)]

    // 3. Atomic Transaction: Consume Energy + Add Item
    // Using a simple sequence here for MVP, should be a Postgres function for true atomicity
    const { error: energyError } = await supabase
      .from('profiles')
      .update({ energy: profile.energy - 1 })
      .eq('id', userId)

    if (energyError) throw energyError

    const { data: itemData, error: itemError } = await supabase
      .from('inventory')
      .insert({
        user_id: userId,
        item_name: randomItem.name,
        emoji: randomItem.emoji,
        rarity: randomItem.rarity,
        base_value: randomItem.value,
      })
      .select()
      .single()

    if (itemError) throw itemError

    return NextResponse.json({
      item: itemData,
      remainingEnergy: profile.energy - 1
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
