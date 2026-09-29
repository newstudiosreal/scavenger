-- =============================================================================
-- SCAVENGER DATABASE SCHEMA
-- Execute this first to create the structure
-- =============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('player', 'moderator', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_rarity AS ENUM ('comune', 'non comune', 'raro', 'epico');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_location AS ENUM ('zaino', 'collezione');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('attivo', 'venduto', 'ritirato');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'player',
  coins INTEGER DEFAULT 0 CHECK (coins >= 0),
  energy INTEGER DEFAULT 15 CHECK (energy >= 0),
  energy_max INTEGER DEFAULT 15,
  energy_last_refill TIMESTAMPTZ DEFAULT now(),
  backpack_capacity INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id),
  name TEXT NOT NULL,
  emoji_or_icon TEXT,
  rarity item_rarity DEFAULT 'comune',
  base_price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  location item_location DEFAULT 'zaino'
);

CREATE TABLE IF NOT EXISTS market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id),
  item_id UUID REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  price INTEGER NOT NULL CHECK (price > 0),
  status listing_status DEFAULT 'attivo',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  item_id UUID REFERENCES items(id),
  quantity INTEGER,
  price INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  item_ids UUID[] NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  reward_badge TEXT
);

CREATE TABLE IF NOT EXISTS collection_progress (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (profile_id, collection_id)
);

-- 3. RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_progress ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Profiles: Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles: Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: Admins can view all" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'superadmin'))
);

-- World/Item Policies
CREATE POLICY "Worlds: Anyone can view" ON worlds FOR SELECT USING (true);
CREATE POLICY "Worlds: Superadmins can manage" ON worlds FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
);
CREATE POLICY "Items: Anyone can view" ON items FOR SELECT USING (true);
CREATE POLICY "Items: Superadmins can manage" ON items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- Inventory Policies
CREATE POLICY "Inventory: Owner can manage" ON inventory FOR ALL USING (auth.uid() = profile_id);

-- Market Policies
CREATE POLICY "Market: Anyone can view active" ON market_listings FOR SELECT USING (status = 'attivo');
CREATE POLICY "Market: Seller can manage" ON market_listings FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Market: Mods can remove" ON market_listings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'superadmin'))
);

-- Transaction Policies
CREATE POLICY "Txs: Own view" ON transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Txs: Superadmin view" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- Collection Policies
CREATE POLICY "Collections: Anyone view" ON collections FOR SELECT USING (true);
CREATE POLICY "CollProgress: Own view" ON collection_progress FOR ALL USING (auth.uid() = profile_id);
