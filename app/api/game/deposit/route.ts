import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId } = await req.json()
    const { data: itemInv, error: invError } = await supabase.from('inventory').select('id, quantity').eq('profile_id', userId).eq('item_id', itemId).eq('location', 'zaino').single()
    if (invError || !itemInv) return NextResponse.json({ error: 'Oggetto non trovato nello zaino' }, { status: 400 })
    await supabase.from('inventory').update({ location: 'collezione' }).eq('id', itemInv.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
