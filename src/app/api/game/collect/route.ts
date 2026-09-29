import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    // 1. Get profile and current energy
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('energy, energy_max, energy_last_refill, backpack_capacity')
      .eq('id', userId)
      .single()

    if (profileError || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // 2. Calculate energy refill
    const now = new Date()
    const lastRefill = new Date(profile.energy_last_refill)
    const hoursPassed = Math.floor((now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60))

    let currentEnergy = profile.energy + hoursPassed
    if (currentEnergy > profile.energy_max) currentEnergy = profile.energy_max

    if (currentEnergy < 1) {
      return NextResponse.json({ error: 'Non hai abbastanza energia!' }, { status: 400 })
    }

    // 3. Check backpack capacity
    const { count: itemCount } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .eq('location', 'zaino')

    if (itemCount && itemCount >= profile.backpack_capacity) {
      return NextResponse.json({ error: 'Zaino pieno! Svuotalo alla base.' }, { status: 400 })
    }

    // 4. Pick a random item from the active world (Parco)
    const { data: world } = await supabase.from('worlds').select('id').eq('is_active', true).single()
    if (!world) return NextResponse.json({ error: 'Nessun mondo attivo' }, { status: 500 })

    const { data: items } = await supabase.from('items').select('id, name, emoji_or_icon').eq('world_id', world.id)
    if (!items || items.length === 0) return NextResponse.json({ error: 'Nessun oggetto disponibile' }, { status: 500 })

    const randomItem = items[Math.floor(Math.random() * items.length)]

    // 5. Atomic update: Consume energy and add item
    // Note: In a production app, this should be a Supabase RPC (stored procedure) for true atomicity
    await supabase.from('profiles').update({
      energy: currentEnergy - 1,
      energy_last_refill: lastRefill // Keep the refill anchor or update it
    }).eq('id', userId)

    const { data: invItem, error: invError } = await supabase.from('inventory').insert({
      profile_id: userId,
      item_id: randomItem.id,
      quantity: 1,
      location: 'zaino'
    }).select().single()

    if (invError) throw invError

    return NextResponse.json({
      item: randomItem,
      remainingEnergy: currentEnergy - 1
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
