-- =============================================================================
-- SCAVENGER INITIAL SEED
-- Execute this SECOND, after schema.sql
-- =============================================================================

-- 1. AUTOMATION: TRIGGER FOR NEW PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    new.id,
    split_part(new.email, '@', 1),
    'player'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to avoid errors during re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. SEED WORLD "PARCO"
INSERT INTO worlds (name, description, is_active)
VALUES ('Parco', 'Un parco cittadino rigoglioso e misterioso.', true)
ON CONFLICT (id) DO NOTHING; -- Assuming IDs aren't hardcoded

-- Use the ID of the 'Parco' world for items
DO $$
DECLARE
    world_id UUID := (SELECT id FROM worlds WHERE name = 'Parco' LIMIT 1);
BEGIN
    IF world_id IS NOT NULL THEN
        INSERT INTO items (world_id, name, emoji_or_icon, rarity, base_price) VALUES
        (world_id, 'Foglia strana', '🍃', 'comune', 10),
        (world_id, 'Rametto', '🌿', 'comune', 5),
        (world_id, 'Lattina', '🥫', 'comune', 8),
        (world_id, 'Sasso', '🪨', 'comune', 5),
        (world_id, 'Giocattolo perso', '🧸', 'non comune', 25),
        (world_id, 'Tappo di bottiglia', '🍾', 'comune', 7),
        (world_id, 'Piuma', '🪶', 'non comune', 20),
        (world_id, 'Bottone', '🔘', 'comune', 12),
        (world_id, 'Chiave arrugginita', '🔑', 'raro', 50),
        (world_id, 'Moneta vecchia', '🪙', 'epico', 150);
    END IF;
END $$;

-- 3. SEED INITIAL COLLECTION
INSERT INTO collections (name, item_ids, reward_coins, reward_badge)
VALUES (
  'Oggetti della scuola',
  (SELECT array_agg(id) FROM (SELECT id FROM items WHERE name IN ('Lattina', 'Tappo di bottiglia', 'Bottone', 'Sasso', 'Rametto')) as t),
  500,
  '🎓 Studente del Parco'
);
