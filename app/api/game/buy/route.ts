import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'Listing ID required' }, { status: 400 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Get Listing
    const { data: listing, error: listError } = await supabase
      .from('market_listings')
      .select('*')
      .eq('id', listingId)
      .single()

    if (listError || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.seller_id === user.id) return NextResponse.json({ error: 'Cannot buy your own item' }, { status: 400 })

    // 2. Check Buyer Coins
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', user.id)
      .single()

    if (!buyerProfile || buyerProfile.coins < listing.price) {
      return NextResponse.json({ error: 'Not enough coins!' }, { status: 400 })
    }

    // 3. Process Atomic Transaction (Simplified for MVP)
    // In production, use a Postgres function to handle these updates in one transaction

    // Deduct from buyer
    const { error: buyerError } = await supabase
      .from('profiles')
      .update({ coins: buyerProfile.coins - listing.price })
      .eq('id', user.id)
    if (buyerError) throw buyerError

    // Add to seller
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', listing.seller_id)
      .single()
    const { error: sellerError } = await supabase
      .from('profiles')
      .update({ coins: (sellerProfile?.coins ?? 0) + listing.price })
      .eq('id', listing.seller_id)
    if (sellerError) throw sellerError

    // Transfer item ownership (Move from market_listings to buyer inventory)
    const { error: itemError } = await supabase
      .from('inventory')
      .insert({
        user_id: user.id,
        item_name: listing.item_name,
        emoji: listing.emoji,
        rarity: listing.rarity,
        base_value: listing.base_value
      })
    if (itemError) throw itemError

    // Remove listing
    const { error: delError } = await supabase.from('market_listings').delete().eq('id', listingId)
    if (delError) throw delError

    return NextResponse.json({ newBalance: buyerProfile.coins - listing.price })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
