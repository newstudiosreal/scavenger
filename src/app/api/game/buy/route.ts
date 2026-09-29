import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { buyerId, listingId } = await req.json()

    // 1. Get listing details
    const { data: listing, error: listError } = await supabase
      .from('market_listings')
      .select('*, items(name, emoji_or_icon)')
      .eq('id', listingId)
      .eq('status', 'attivo')
      .single()

    if (listError || !listing) return NextResponse.json({ error: 'Inserzione non disponibile' }, { status: 400 })

    const sellerId = listing.seller_id
    const itemId = listing.item_id
    const price = listing.price

    if (buyerId === sellerId) return NextResponse.json({ error: 'Non puoi comprare i tuoi oggetti' }, { status: 400 })

    // 2. Check buyer coins
    const { data: buyerProfile } = await supabase.from('profiles').select('coins').eq('id', buyerId).single()
    if (!buyerProfile || buyerProfile.coins < price) return NextResponse.json({ error: 'Coin insufficienti' }, { status: 400 })

    // 3. Atomic Transaction (Simulated via sequential updates)
    // Subtract from buyer
    await supabase.from('profiles').update({ coins: buyerProfile.coins - price }).eq('id', buyerId)
    // Add to seller
    const { data: sellerProfile } = await supabase.from('profiles').select('coins').eq('id', sellerId).single()
    await supabase.from('profiles').update({ coins: (sellerProfile?.coins || 0) + price }).eq('id', sellerId)
    // Update listing status
    await supabase.from('market_listings').update({ status: 'venduto' }).eq('id', listingId)
    // Add item to buyer inventory
    await supabase.from('inventory').insert({
      profile_id: buyerId,
      item_id: itemId,
      quantity: listing.quantity,
      location: 'zaino'
    })
    // Record transaction
    await supabase.from('transactions').insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      item_id: itemId,
      quantity: listing.quantity,
      price: price
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
