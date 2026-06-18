-- Seed canonical maternal wellness specialties for intake/search pickers.
-- Production has no local_search_seed; the original backfill only copied legacy users.specialty JSON.

insert into public.specialties (slug, label)
values
  ('lactation-support', 'Lactation support'),
  ('postpartum-doula-care', 'Doula care'),
  ('mental-health-therapy', 'Mental health & therapy'),
  ('pelvic-floor-physical-therapy', 'Pelvic floor & physical therapy'),
  ('sleep-infant-care', 'Sleep & infant care'),
  ('nutrition-wellness', 'Nutrition & wellness')
on conflict (slug) do update
set label = excluded.label;
