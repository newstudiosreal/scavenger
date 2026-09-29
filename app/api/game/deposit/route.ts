import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userId, item } = await req.json()
    if (!userId || !item) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const { error } = await supabase
      .from('inventory')
      .insert({
        user_id: userId,
        item_name: item.name,
        emoji: item.emoji,
        rarity: item.rarity,
        base_value: item.value
      })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
