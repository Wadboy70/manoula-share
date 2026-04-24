-- Local-only seed data for manual search testing (specialties, professionals, services, geo).
-- Safe to run repeatedly (`supabase db query --local --file ...` or via seed:local script).
--
-- Geographic columns follow `docs/database-schema.md`:
--   professional_search_profiles: base/home Mapbox place (radius checks use this lat/lng).
--   services: delivery_mode, service_area_type, service_radius_km, service_area_text.
--   service_area_places: explicit cities/regions for service_area_type = place_list.
--   service_provider_locations: clinic/studio rows for delivery_mode = provider_location.
--
-- `mapbox_id` / coordinates for profiles and geo child rows come from Mapbox Geocoding v6
-- forward results captured in `notes/mapbox-id-locations.md` (feature `id` / `properties.mapbox_id`,
-- `geometry.coordinates` as [longitude, latitude]). Greater London row uses the London feature's
-- `context.district.mapbox_id` (Greater London) with an approximate centroid for lat/lng.
--
-- Seed professionals (15): seven detailed fixtures (Ada…Mei) plus eight “pagination bench” pros
-- (remote-only, reused Mapbox home coords from the rows above) so authenticated /search can load
-- more than one page at limit 10. See `--- Search pagination / ratings ---` for reviews.

do $$
begin
  insert into public.specialties (slug, label)
  values
    ('lactation-consultant', 'Lactation Consultant'),
    ('postpartum-doula', 'Postpartum Doula'),
    ('pelvic-floor-therapy', 'Pelvic Floor Therapy'),
    ('maternal-nutrition', 'Maternal Nutrition')
  on conflict (slug) do update
  set label = excluded.label;

  insert into public.users (
    auth_user_id,
    email,
    first_name,
    last_name,
    profile_photo_url,
    is_professional,
    country_code,
    bio
  )
  values
    (
      '11111111-1111-1111-1111-111111111111',
      'local-pro-ada@manoula.test',
      'Ada',
      'Nwosu',
      'https://mockmind-api.uifaces.co/content/human/212.jpg',
      true,
      'GB',
      'Calm, evidence-informed lactation and postpartum support.'
    ),
    (
      '22222222-2222-2222-2222-222222222222',
      'local-pro-evelyn@manoula.test',
      'Evelyn',
      'Baker',
      'https://mockmind-api.uifaces.co/content/human/219.jpg',
      true,
      'GB',
      'Holistic postpartum and nutrition planning for new mothers.'
    ),
    (
      '33333333-3333-3333-3333-333333333333',
      'local-pro-priya@manoula.test',
      'Priya',
      'Sharma',
      'https://mockmind-api.uifaces.co/content/human/201.jpg',
      true,
      'GB',
      'Pelvic health and postpartum recovery in the West Midlands.'
    ),
    (
      '44444444-4444-4444-4444-444444444444',
      'local-pro-james@manoula.test',
      'James',
      'O''Connor',
      'https://mockmind-api.uifaces.co/content/human/202.jpg',
      true,
      'GB',
      'Lactation support across Bristol and surrounding towns.'
    ),
    (
      '55555555-5555-5555-5555-555555555555',
      'local-pro-amina@manoula.test',
      'Amina',
      'El-Sayed',
      'https://mockmind-api.uifaces.co/content/human/203.jpg',
      true,
      'GB',
      'Practical maternal nutrition with an Edinburgh focus.'
    ),
    (
      '66666666-6666-6666-6666-666666666666',
      'local-pro-sofia@manoula.test',
      'Sofia',
      'Rossi',
      'https://mockmind-api.uifaces.co/content/human/204.jpg',
      true,
      'GB',
      'Hands-on pelvic floor therapy and remote follow-up.'
    ),
    (
      '77777777-7777-7777-7777-777777777777',
      'local-pro-mei@manoula.test',
      'Mei',
      'Lin',
      'https://mockmind-api.uifaces.co/content/human/205.jpg',
      true,
      'GB',
      'Gentle postpartum doula care in Yorkshire.'
    ),
    (
      '88888888-1111-4111-8111-111111110101',
      'local-pro-page-01@manoula.test',
      'Nina',
      'Foster',
      'https://mockmind-api.uifaces.co/content/human/206.jpg',
      true,
      'GB',
      'IBCLC covering Greater London — video consults plus selective home visits for complex feeding.'
    ),
    (
      '88888888-2222-4222-8222-222222220202',
      'local-pro-page-02@manoula.test',
      'Omar',
      'Hassan',
      'https://mockmind-api.uifaces.co/content/human/207.jpg',
      true,
      'GB',
      'Postpartum doula in Greater Manchester — daytime blocks, nights by arrangement, and remote check-ins.'
    ),
    (
      '88888888-3333-4333-8333-333333330303',
      'local-pro-page-03@manoula.test',
      'Paula',
      'Wright',
      'https://mockmind-api.uifaces.co/content/human/208.jpg',
      true,
      'GB',
      'Pelvic health physiotherapist in the West Midlands — telehealth programmes and in-person assessments.'
    ),
    (
      '88888888-4444-4444-8444-444444440404',
      'local-pro-page-04@manoula.test',
      'Quinn',
      'Morgan',
      'https://mockmind-api.uifaces.co/content/human/209.jpg',
      true,
      'GB',
      'Maternal nutritionist focused on Bristol and Bath — practical meal plans and gentle accountability.'
    ),
    (
      '88888888-5555-4555-8555-555555550505',
      'local-pro-page-05@manoula.test',
      'Rosa',
      'MacLeod',
      'https://mockmind-api.uifaces.co/content/human/210.jpg',
      true,
      'GB',
      'Lactation consultant in Edinburgh — tongue-tie referrals, pumping plans, and return-to-work feeding.'
    ),
    (
      '88888888-6666-4666-8666-666666660606',
      'local-pro-page-06@manoula.test',
      'Sam',
      'Adebayo',
      'https://mockmind-api.uifaces.co/content/human/211.jpg',
      true,
      'GB',
      'Postpartum doula across South Wales — bilingual support, sibling care tips, and overnight respite.'
    ),
    (
      '88888888-7777-4777-8777-777777770707',
      'local-pro-page-07@manoula.test',
      'Tara',
      'Singh',
      'https://mockmind-api.uifaces.co/content/human/212.jpg',
      true,
      'GB',
      'Pelvic floor specialist serving West Yorkshire — core and floor rehab after birth and surgery.'
    ),
    (
      '88888888-8888-4888-8888-888888880808',
      'local-pro-page-08@manoula.test',
      'Uma',
      'Brooks',
      'https://mockmind-api.uifaces.co/content/human/213.jpg',
      true,
      'GB',
      'Maternal nutrition coach (London) — gestational diabetes-friendly menus and postnatal recovery fuel.'
    )
  on conflict (email) do update
  set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    profile_photo_url = excluded.profile_photo_url,
    is_professional = excluded.is_professional,
    country_code = excluded.country_code,
    bio = excluded.bio;

  insert into public.professional_search_profiles (
    user_id,
    is_profile_complete,
    is_public_searchable,
    is_active,
    is_approved,
    country_code,
    location_label,
    mapbox_id,
    latitude,
    longitude,
    geocoded_at,
    offers_remote,
    offers_in_home,
    offers_provider_location
  )
  select
    u.id,
    true,
    true,
    true,
    true,
    'GB',
    case u.email
      when 'local-pro-ada@manoula.test' then 'London, United Kingdom'
      when 'local-pro-evelyn@manoula.test' then 'Manchester, United Kingdom'
      when 'local-pro-priya@manoula.test' then 'Birmingham, United Kingdom'
      when 'local-pro-james@manoula.test' then 'Bristol, United Kingdom'
      when 'local-pro-amina@manoula.test' then 'Edinburgh, United Kingdom'
      when 'local-pro-sofia@manoula.test' then 'Cardiff, United Kingdom'
      when 'local-pro-mei@manoula.test' then 'Leeds, United Kingdom'
    end,
    case u.email
      when 'local-pro-ada@manoula.test' then 'dXJuOm1ieHBsYzphaWhQ'
      when 'local-pro-evelyn@manoula.test' then 'dXJuOm1ieHBsYzpieWhQ'
      when 'local-pro-priya@manoula.test' then 'dXJuOm1ieHBsYzpGRWhQ'
      when 'local-pro-james@manoula.test' then 'dXJuOm1ieHBsYzpHMGhQ'
      when 'local-pro-amina@manoula.test' then 'dXJuOm1ieHBsYzpPdWhQ'
      when 'local-pro-sofia@manoula.test' then 'dXJuOm1ieHBsYzpJdWhQ'
      when 'local-pro-mei@manoula.test' then 'dXJuOm1ieHBsYzpZV2hQ'
    end,
    case u.email
      when 'local-pro-ada@manoula.test' then 51.5073::double precision
      when 'local-pro-evelyn@manoula.test' then 53.479489::double precision
      when 'local-pro-priya@manoula.test' then 52.479699::double precision
      when 'local-pro-james@manoula.test' then 51.453802::double precision
      when 'local-pro-amina@manoula.test' then 55.953346::double precision
      when 'local-pro-sofia@manoula.test' then 51.481655::double precision
      when 'local-pro-mei@manoula.test' then 53.797418::double precision
    end,
    case u.email
      when 'local-pro-ada@manoula.test' then -0.127647::double precision
      when 'local-pro-evelyn@manoula.test' then -2.245115::double precision
      when 'local-pro-priya@manoula.test' then -1.902691::double precision
      when 'local-pro-james@manoula.test' then -2.597298::double precision
      when 'local-pro-amina@manoula.test' then -3.188375::double precision
      when 'local-pro-sofia@manoula.test' then -3.179193::double precision
      when 'local-pro-mei@manoula.test' then -1.543794::double precision
    end,
    now(),
    true,
    case u.email
      when 'local-pro-ada@manoula.test' then true
      when 'local-pro-evelyn@manoula.test' then true
      when 'local-pro-priya@manoula.test' then true
      when 'local-pro-james@manoula.test' then true
      when 'local-pro-amina@manoula.test' then true
      when 'local-pro-sofia@manoula.test' then false
      when 'local-pro-mei@manoula.test' then true
    end,
    case u.email
      when 'local-pro-ada@manoula.test' then false
      when 'local-pro-evelyn@manoula.test' then true
      when 'local-pro-priya@manoula.test' then false
      when 'local-pro-james@manoula.test' then false
      when 'local-pro-amina@manoula.test' then false
      when 'local-pro-sofia@manoula.test' then true
      when 'local-pro-mei@manoula.test' then false
    end
  from public.users u
  where u.email in (
    'local-pro-ada@manoula.test',
    'local-pro-evelyn@manoula.test',
    'local-pro-priya@manoula.test',
    'local-pro-james@manoula.test',
    'local-pro-amina@manoula.test',
    'local-pro-sofia@manoula.test',
    'local-pro-mei@manoula.test'
  )
  on conflict (user_id) do update
  set
    is_profile_complete = excluded.is_profile_complete,
    is_public_searchable = excluded.is_public_searchable,
    is_active = excluded.is_active,
    is_approved = excluded.is_approved,
    country_code = excluded.country_code,
    location_label = excluded.location_label,
    mapbox_id = excluded.mapbox_id,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    geocoded_at = excluded.geocoded_at,
    offers_remote = excluded.offers_remote,
    offers_in_home = excluded.offers_in_home,
    offers_provider_location = excluded.offers_provider_location;

  -- Pagination bench: listable profiles (Mapbox ids / coords reused from primary seed cities).
  insert into public.professional_search_profiles (
    user_id,
    is_profile_complete,
    is_public_searchable,
    is_active,
    is_approved,
    country_code,
    location_label,
    mapbox_id,
    latitude,
    longitude,
    geocoded_at,
    offers_remote,
    offers_in_home,
    offers_provider_location
  )
  select u.id, true, true, true, true, 'GB', g.label, g.mapbox_id, g.lat, g.lng, now(), true, false, false
  from public.users u
  inner join (
    values
      ('local-pro-page-01@manoula.test'::text, 'London, United Kingdom'::text, 'dXJuOm1ieHBsYzphaWhQ'::text, 51.5073::double precision, -0.127647::double precision),
      ('local-pro-page-02@manoula.test', 'Manchester, United Kingdom', 'dXJuOm1ieHBsYzpieWhQ', 53.479489, -2.245115),
      ('local-pro-page-03@manoula.test', 'Birmingham, United Kingdom', 'dXJuOm1ieHBsYzpGRWhQ', 52.479699, -1.902691),
      ('local-pro-page-04@manoula.test', 'Bristol, United Kingdom', 'dXJuOm1ieHBsYzpHMGhQ', 51.453802, -2.597298),
      ('local-pro-page-05@manoula.test', 'Edinburgh, United Kingdom', 'dXJuOm1ieHBsYzpPdWhQ', 55.953346, -3.188375),
      ('local-pro-page-06@manoula.test', 'Cardiff, United Kingdom', 'dXJuOm1ieHBsYzpJdWhQ', 51.481655, -3.179193),
      ('local-pro-page-07@manoula.test', 'Leeds, United Kingdom', 'dXJuOm1ieHBsYzpZV2hQ', 53.797418, -1.543794),
      ('local-pro-page-08@manoula.test', 'London, United Kingdom', 'dXJuOm1ieHBsYzphaWhQ', 51.5073, -0.127647)
  ) as g(email, label, mapbox_id, lat, lng) on u.email = g.email
  on conflict (user_id) do update
  set
    is_profile_complete = excluded.is_profile_complete,
    is_public_searchable = excluded.is_public_searchable,
    is_active = excluded.is_active,
    is_approved = excluded.is_approved,
    country_code = excluded.country_code,
    location_label = excluded.location_label,
    mapbox_id = excluded.mapbox_id,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    geocoded_at = excluded.geocoded_at,
    offers_remote = excluded.offers_remote,
    offers_in_home = excluded.offers_in_home,
    offers_provider_location = excluded.offers_provider_location;

  with professional_ids as (
    select id
    from public.users
    where email in (
      'local-pro-ada@manoula.test',
      'local-pro-evelyn@manoula.test',
      'local-pro-priya@manoula.test',
      'local-pro-james@manoula.test',
      'local-pro-amina@manoula.test',
      'local-pro-sofia@manoula.test',
      'local-pro-mei@manoula.test',
      'local-pro-page-01@manoula.test',
      'local-pro-page-02@manoula.test',
      'local-pro-page-03@manoula.test',
      'local-pro-page-04@manoula.test',
      'local-pro-page-05@manoula.test',
      'local-pro-page-06@manoula.test',
      'local-pro-page-07@manoula.test',
      'local-pro-page-08@manoula.test'
    )
  )
  delete from public.professional_specialties ps
  using professional_ids p
  where ps.professional_id = p.id;

  insert into public.professional_specialties (professional_id, specialty_id)
  select u.id, s.id
  from public.users u
  join public.specialties s
    on (
      (u.email = 'local-pro-ada@manoula.test' and s.slug in ('lactation-consultant', 'postpartum-doula'))
      or (u.email = 'local-pro-evelyn@manoula.test' and s.slug in ('maternal-nutrition', 'pelvic-floor-therapy'))
      or (u.email = 'local-pro-priya@manoula.test' and s.slug in ('pelvic-floor-therapy', 'postpartum-doula'))
      or (u.email = 'local-pro-james@manoula.test' and s.slug in ('lactation-consultant'))
      or (u.email = 'local-pro-amina@manoula.test' and s.slug in ('maternal-nutrition'))
      or (u.email = 'local-pro-sofia@manoula.test' and s.slug in ('pelvic-floor-therapy', 'maternal-nutrition'))
      or (u.email = 'local-pro-mei@manoula.test' and s.slug in ('postpartum-doula'))
      or (u.email = 'local-pro-page-01@manoula.test' and s.slug in ('lactation-consultant'))
      or (u.email = 'local-pro-page-02@manoula.test' and s.slug in ('postpartum-doula'))
      or (u.email = 'local-pro-page-03@manoula.test' and s.slug in ('pelvic-floor-therapy'))
      or (u.email = 'local-pro-page-04@manoula.test' and s.slug in ('maternal-nutrition'))
      or (u.email = 'local-pro-page-05@manoula.test' and s.slug in ('lactation-consultant'))
      or (u.email = 'local-pro-page-06@manoula.test' and s.slug in ('postpartum-doula'))
      or (u.email = 'local-pro-page-07@manoula.test' and s.slug in ('pelvic-floor-therapy'))
      or (u.email = 'local-pro-page-08@manoula.test' and s.slug in ('maternal-nutrition'))
    )
  where u.email in (
    'local-pro-ada@manoula.test',
    'local-pro-evelyn@manoula.test',
    'local-pro-priya@manoula.test',
    'local-pro-james@manoula.test',
    'local-pro-amina@manoula.test',
    'local-pro-sofia@manoula.test',
    'local-pro-mei@manoula.test',
    'local-pro-page-01@manoula.test',
    'local-pro-page-02@manoula.test',
    'local-pro-page-03@manoula.test',
    'local-pro-page-04@manoula.test',
    'local-pro-page-05@manoula.test',
    'local-pro-page-06@manoula.test',
    'local-pro-page-07@manoula.test',
    'local-pro-page-08@manoula.test'
  )
  on conflict (professional_id, specialty_id) do nothing;

  with professionals as (
    select id, email
    from public.users
    where email in (
      'local-pro-ada@manoula.test',
      'local-pro-evelyn@manoula.test',
      'local-pro-priya@manoula.test',
      'local-pro-james@manoula.test',
      'local-pro-amina@manoula.test',
      'local-pro-sofia@manoula.test',
      'local-pro-mei@manoula.test',
      'local-pro-page-01@manoula.test',
      'local-pro-page-02@manoula.test',
      'local-pro-page-03@manoula.test',
      'local-pro-page-04@manoula.test',
      'local-pro-page-05@manoula.test',
      'local-pro-page-06@manoula.test',
      'local-pro-page-07@manoula.test',
      'local-pro-page-08@manoula.test'
    )
  )
  delete from public.reviews r
  using professionals p
  where r.professional_id = p.id;

  -- --- Search pagination / ratings --- (varied reviews; eight `local-pro-page-*` pros pad list to 15 for Load more)
  insert into public.reviews (professional_id, reviewer_id, rating, review_text)
  select p.id, null, v.rating, v.review_text
  from public.users p
  cross join lateral (
    values
      ('local-pro-ada@manoula.test'::text, 5::smallint, 'Excellent lactation support.'::text),
      ('local-pro-ada@manoula.test', 5, 'Calm, evidence-based advice.'),
      ('local-pro-ada@manoula.test', 4, 'Very helpful first weeks.'),
      ('local-pro-evelyn@manoula.test', 5, 'Holistic and practical.'),
      ('local-pro-evelyn@manoula.test', 5, 'Highly recommend Evelyn.'),
      ('local-pro-evelyn@manoula.test', 4, 'Good nutrition follow-up.'),
      ('local-pro-evelyn@manoula.test', 5, 'Clear meal planning.'),
      ('local-pro-priya@manoula.test', 4, 'Great pelvic floor programme.'),
      ('local-pro-priya@manoula.test', 4, 'Supportive sessions.'),
      ('local-pro-james@manoula.test', 5, 'Quick, practical feeding fixes.'),
      ('local-pro-james@manoula.test', 3, 'Good but scheduling was tight.'),
      ('local-pro-amina@manoula.test', 5, 'Sensible Edinburgh nutrition help.'),
      ('local-pro-amina@manoula.test', 5, 'Meal ideas that actually work.'),
      ('local-pro-sofia@manoula.test', 5, 'Clear explanations in studio.'),
      ('local-pro-sofia@manoula.test', 4, 'Professional assessments.'),
      ('local-pro-mei@manoula.test', 4, 'Warm postpartum visits.'),
      ('local-pro-mei@manoula.test', 4, 'Reliable doula support.'),
      ('local-pro-page-01@manoula.test', 4, 'Clear, kind advice on pumping and latch.'),
      ('local-pro-page-01@manoula.test', 5, 'Nina was calm and practical when we were exhausted.'),
      ('local-pro-page-02@manoula.test', 3, 'Good support; wish we had booked more hours upfront.'),
      ('local-pro-page-02@manoula.test', 4, 'Omar helped us find a rhythm with a newborn and a toddler.'),
      ('local-pro-page-03@manoula.test', 5, 'Exercises were easy to follow between appointments.'),
      ('local-pro-page-03@manoula.test', 5, 'Paula explained everything without jargon.'),
      ('local-pro-page-04@manoula.test', 4, 'Sensible meal ideas that fit a busy household.'),
      ('local-pro-page-04@manoula.test', 4, 'Quinn helped me stabilise energy in the fourth trimester.'),
      ('local-pro-page-05@manoula.test', 5, 'Rosa spotted a tongue-tie concern quickly.'),
      ('local-pro-page-05@manoula.test', 4, 'Great follow-up after our hospital stay.'),
      ('local-pro-page-06@manoula.test', 4, 'Warm presence overnight — we actually slept.'),
      ('local-pro-page-06@manoula.test', 3, 'Occasionally hard to reach by text same day.'),
      ('local-pro-page-07@manoula.test', 5, 'Tara tailored rehab after my C-section.'),
      ('local-pro-page-07@manoula.test', 5, 'Progressive programme; felt stronger week by week.'),
      ('local-pro-page-08@manoula.test', 4, 'Uma made GDM meal planning feel manageable.'),
      ('local-pro-page-08@manoula.test', 5, 'Thoughtful recipes and no shame about cravings.')
  ) as v(email, rating, review_text)
  where p.email = v.email;

  with professionals as (
    select id
    from public.users
    where email in (
      'local-pro-ada@manoula.test',
      'local-pro-evelyn@manoula.test',
      'local-pro-priya@manoula.test',
      'local-pro-james@manoula.test',
      'local-pro-amina@manoula.test',
      'local-pro-sofia@manoula.test',
      'local-pro-mei@manoula.test',
      'local-pro-page-01@manoula.test',
      'local-pro-page-02@manoula.test',
      'local-pro-page-03@manoula.test',
      'local-pro-page-04@manoula.test',
      'local-pro-page-05@manoula.test',
      'local-pro-page-06@manoula.test',
      'local-pro-page-07@manoula.test',
      'local-pro-page-08@manoula.test'
    )
  )
  delete from public.services sv
  using professionals p
  where sv.professional_id = p.id;

  insert into public.services (
    professional_id,
    specialty_id,
    title,
    description,
    delivery_mode,
    remote_scope,
    provider_location_name,
    service_area_type,
    service_radius_km,
    service_area_text,
    price_cents,
    currency_code,
    is_active
  )
  select
    u.id,
    s.id,
    v.title,
    v.description,
    v.delivery_mode,
    v.remote_scope,
    v.provider_location_name,
    v.service_area_type,
    v.service_radius_km,
    v.service_area_text,
    v.price_cents,
    'GBP',
    true
  from public.users u
  cross join lateral (
    values
      (
        'local-pro-ada@manoula.test',
        'lactation-consultant'::text,
        'Lactation consultation (virtual)'::text,
        'Video or phone support for feeding questions.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        6500::integer
      ),
      (
        'local-pro-ada@manoula.test',
        'postpartum-doula'::text,
        'In-home postpartum (listed boroughs)'::text,
        'Home visits where borough appears in our configured place list.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'place_list'::text,
        null::numeric(6, 2),
        'Greater London boroughs on file.'::text,
        12000::integer
      ),
      (
        'local-pro-ada@manoula.test',
        'postpartum-doula'::text,
        'In-home visit (radius from base)'::text,
        'Short travel from Ada''s base location; distance uses profile coordinates.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        25::numeric(6, 2),
        'Within 25 km of central London (seed profile).'::text,
        9500::integer
      ),
      (
        'local-pro-evelyn@manoula.test',
        'maternal-nutrition'::text,
        'Clinic nutrition session'::text,
        'One-to-one session at our Manchester studio.'::text,
        'provider_location'::text,
        null::text,
        'Evelyn Baker — Manchester Studio'::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        8500::integer
      ),
      (
        'local-pro-evelyn@manoula.test',
        'maternal-nutrition'::text,
        'Nutrition coaching (remote check-ins)'::text,
        'Remote messaging and video check-ins between in-person visits.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        7000::integer
      ),
      (
        'local-pro-evelyn@manoula.test',
        'maternal-nutrition'::text,
        'Nutrition coaching (Manchester visits)'::text,
        'In-person Manchester catch-ups; see service_area_places for footprint.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'place_list'::text,
        null::numeric(6, 2),
        'Manchester city region (see service_area_places).'::text,
        7000::integer
      ),
      (
        'local-pro-priya@manoula.test',
        'pelvic-floor-therapy'::text,
        'Pelvic floor telehealth'::text,
        'Guided sessions and homework plans online.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        5500::integer
      ),
      (
        'local-pro-priya@manoula.test',
        'postpartum-doula'::text,
        'Postpartum home support (Birmingham radius)'::text,
        'In-home visits within a short drive of Birmingham base.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        15::numeric(6, 2),
        'Within 15 km of Birmingham (seed profile).'::text,
        11000::integer
      ),
      (
        'local-pro-james@manoula.test',
        'lactation-consultant'::text,
        'Lactation drop-in (virtual)'::text,
        'Quick video troubleshooting for common feeding issues.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        4500::integer
      ),
      (
        'local-pro-james@manoula.test',
        'lactation-consultant'::text,
        'Home visits — Bristol area'::text,
        'Listed towns only; see service_area_places.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'place_list'::text,
        null::numeric(6, 2),
        'Bristol and Bath corridor.'::text,
        10500::integer
      ),
      (
        'local-pro-amina@manoula.test',
        'maternal-nutrition'::text,
        'Nutrition reset (remote)'::text,
        'Structured programme with messaging support.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        6000::integer
      ),
      (
        'local-pro-amina@manoula.test',
        'maternal-nutrition'::text,
        'Edinburgh nutrition plus (remote)'::text,
        'Remote meal logging and messaging support.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        7200::integer
      ),
      (
        'local-pro-amina@manoula.test',
        'maternal-nutrition'::text,
        'Edinburgh nutrition plus (in-person)'::text,
        'In-person weigh-ins in Edinburgh; see service_area_places.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'place_list'::text,
        null::numeric(6, 2),
        'City of Edinburgh local footprint.'::text,
        7200::integer
      ),
      (
        'local-pro-sofia@manoula.test',
        'pelvic-floor-therapy'::text,
        'Studio pelvic assessment'::text,
        'Hands-on assessment at our Cardiff studio.'::text,
        'provider_location'::text,
        null::text,
        'Sofia Rossi — Cardiff Clinic'::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        9000::integer
      ),
      (
        'local-pro-sofia@manoula.test',
        'maternal-nutrition'::text,
        'Telehealth pelvic follow-up'::text,
        'Short remote sessions between in-person blocks.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        4000::integer
      ),
      (
        'local-pro-mei@manoula.test',
        'postpartum-doula'::text,
        'Postpartum check-in (remote)'::text,
        'Phone and video support for the fourth trimester.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        5000::integer
      ),
      (
        'local-pro-mei@manoula.test',
        'postpartum-doula'::text,
        'Leeds area home visit'::text,
        'Daytime visits within radius of Leeds base.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        30::numeric(6, 2),
        'Within 30 km of Leeds (seed profile).'::text,
        13000::integer
      ),
      (
        'local-pro-page-01@manoula.test',
        'lactation-consultant'::text,
        'Video lactation consultation (60 min)'::text,
        'Feeding assessment, flange fit check, and a written plan you can share with your GP or HV.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        6200::integer
      ),
      (
        'local-pro-page-01@manoula.test',
        'lactation-consultant'::text,
        'Home lactation visit (within 20 km of London)'::text,
        'Hands-on latch support and weighted feed where appropriate; travel from central London base.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        20::numeric(6, 2),
        'Within 20 km of Nina''s London base (seed profile).'::text,
        10500::integer
      ),
      (
        'local-pro-page-02@manoula.test',
        'postpartum-doula'::text,
        'Fourth-trimester check-in (video)'::text,
        'Weekly video calls for routine, sleep shaping, and emotional debrief in the first eight weeks.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        4800::integer
      ),
      (
        'local-pro-page-02@manoula.test',
        'postpartum-doula'::text,
        'Daytime doula block (Manchester radius)'::text,
        'Four-hour daytime visits for feeds, light meal prep, and sibling transitions.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        18::numeric(6, 2),
        'Within 18 km of Omar''s Manchester base (seed profile).'::text,
        14000::integer
      ),
      (
        'local-pro-page-03@manoula.test',
        'pelvic-floor-therapy'::text,
        'Pelvic floor telehealth programme'::text,
        'Six-week progressive programme with homework videos and messaging check-ins between sessions.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        5400::integer
      ),
      (
        'local-pro-page-03@manoula.test',
        'pelvic-floor-therapy'::text,
        'Birmingham in-person assessment'::text,
        'One-off assessment visit with internal/external exam where clinically appropriate and consenting.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        15::numeric(6, 2),
        'Within 15 km of Paula''s Birmingham base (seed profile).'::text,
        9500::integer
      ),
      (
        'local-pro-page-04@manoula.test',
        'maternal-nutrition'::text,
        'Nutrition reset (remote)'::text,
        'Structured two-week reset with shopping lists and batch-cook friendly recipes for busy parents.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        5800::integer
      ),
      (
        'local-pro-page-04@manoula.test',
        'maternal-nutrition'::text,
        'Bristol & Bath corridor walk-and-talk'::text,
        'Gentle accountability walks combining movement, hydration, and snack planning for postnatal recovery.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        22::numeric(6, 2),
        'Within 22 km of Quinn''s Bristol base (seed profile).'::text,
        7200::integer
      ),
      (
        'local-pro-page-05@manoula.test',
        'lactation-consultant'::text,
        'Return-to-work pumping plan (remote)'::text,
        'Schedule design, flange sizing notes, and stash-building calendar for the weeks before your start date.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        5100::integer
      ),
      (
        'local-pro-page-05@manoula.test',
        'lactation-consultant'::text,
        'Edinburgh home latch visit'::text,
        'In-home visit for complex latch, weighted feed, and referral letter if specialist follow-up is needed.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        12::numeric(6, 2),
        'Within 12 km of Rosa''s Edinburgh base (seed profile).'::text,
        11200::integer
      ),
      (
        'local-pro-page-06@manoula.test',
        'postpartum-doula'::text,
        'Overnight doula (Cardiff area)'::text,
        'Ten-hour overnight support: baby care while parents sleep, pump parts washed, morning handover.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        25::numeric(6, 2),
        'Within 25 km of Sam''s Cardiff base (seed profile).'::text,
        18500::integer
      ),
      (
        'local-pro-page-06@manoula.test',
        'postpartum-doula'::text,
        'Sibling transition coaching (video)'::text,
        'Three short video sessions to prepare older children and reduce jealousy when baby arrives home.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        3600::integer
      ),
      (
        'local-pro-page-07@manoula.test',
        'pelvic-floor-therapy'::text,
        'Postnatal core & floor class (remote)'::text,
        'Small-group Zoom series focusing on breath, pressure management, and graded return to activity.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        4400::integer
      ),
      (
        'local-pro-page-07@manoula.test',
        'pelvic-floor-therapy'::text,
        'Leeds-area hands-on follow-up'::text,
        'Progressive session for scar mobility, hip strategy, and return-to-running readiness when appropriate.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        20::numeric(6, 2),
        'Within 20 km of Tara''s Leeds base (seed profile).'::text,
        8800::integer
      ),
      (
        'local-pro-page-08@manoula.test',
        'maternal-nutrition'::text,
        'GDM-friendly meal planning (remote)'::text,
        'Carb awareness, label reading, and snack swaps tailored to third trimester and early postpartum.'::text,
        'remote'::text,
        'anywhere'::text,
        null::text,
        null::text,
        null::numeric(6, 2),
        null::text,
        5900::integer
      ),
      (
        'local-pro-page-08@manoula.test',
        'maternal-nutrition'::text,
        'Postnatal refuel intensive (London)'::text,
        'Two-hour in-home pantry sweep plus batch-cook plan for the first month after birth.'::text,
        'in_home'::text,
        null::text,
        null::text,
        'radius'::text,
        15::numeric(6, 2),
        'Within 15 km of Uma''s London base (seed profile).'::text,
        12500::integer
      )
  ) as v(
    email,
    specialty_slug,
    title,
    description,
    delivery_mode,
    remote_scope,
    provider_location_name,
    service_area_type,
    service_radius_km,
    service_area_text,
    price_cents
  )
  join public.specialties s on s.slug = v.specialty_slug
  where u.email = v.email;

  insert into public.service_area_places (
    service_id,
    country_code,
    location_label,
    mapbox_id,
    latitude,
    longitude,
    geocoded_at
  )
  select s.id, v.country_code, v.location_label, v.mapbox_id, v.latitude, v.longitude, now()
  from public.services s
  join public.users u on u.id = s.professional_id
  cross join lateral (
    values
      (
        'local-pro-ada@manoula.test',
        'In-home postpartum (listed boroughs)',
        'GB',
        'Greater London, United Kingdom',
        'dXJuOm1ieHBsYzpDUVpQ',
        51.52726::double precision,
        -0.0992375::double precision
      ),
      (
        'local-pro-ada@manoula.test',
        'In-home postpartum (listed boroughs)',
        'GB',
        'Camden, London, United Kingdom',
        'dXJuOm1ieHBsYzpBZUVLVHc',
        51.541805::double precision,
        -0.13837::double precision
      ),
      (
        'local-pro-evelyn@manoula.test',
        'Nutrition coaching (Manchester visits)',
        'GB',
        'Manchester, United Kingdom',
        'dXJuOm1ieHBsYzpieWhQ',
        53.479489::double precision,
        -2.245115::double precision
      ),
      (
        'local-pro-james@manoula.test',
        'Home visits — Bristol area',
        'GB',
        'Bristol, United Kingdom',
        'dXJuOm1ieHBsYzpHMGhQ',
        51.453802::double precision,
        -2.597298::double precision
      ),
      (
        'local-pro-james@manoula.test',
        'Home visits — Bristol area',
        'GB',
        'Bath, United Kingdom',
        'dXJuOm1ieHBsYzpEbWhQ',
        51.381386::double precision,
        -2.359696::double precision
      ),
      (
        'local-pro-amina@manoula.test',
        'Edinburgh nutrition plus (in-person)',
        'GB',
        'Edinburgh, United Kingdom',
        'dXJuOm1ieHBsYzpPdWhQ',
        55.953346::double precision,
        -3.188375::double precision
      )
  ) as v(
    user_email,
    service_title,
    country_code,
    location_label,
    mapbox_id,
    latitude,
    longitude
  )
  where u.email = v.user_email
    and s.title = v.service_title;

  insert into public.service_provider_locations (
    service_id,
    location_name,
    country_code,
    location_label,
    mapbox_id,
    latitude,
    longitude,
    geocoded_at
  )
  select
    s.id,
    v.location_name,
    'GB',
    v.location_label,
    v.mapbox_id,
    v.latitude,
    v.longitude,
    now()
  from public.services s
  join public.users u on u.id = s.professional_id
  cross join lateral (
    values
      (
        'local-pro-evelyn@manoula.test',
        'Clinic nutrition session',
        'Manchester Studio',
        'Manchester city centre studio',
        'dXJuOm1ieHBsYzpieWhQ',
        53.4843::double precision,
        -2.2366::double precision
      ),
      (
        'local-pro-sofia@manoula.test',
        'Studio pelvic assessment',
        'Cardiff Bay Clinic',
        'Cardiff city centre clinic',
        'dXJuOm1ieHBsYzpJdWhQ',
        51.475::double precision,
        -3.172::double precision
      )
  ) as v(user_email, service_title, location_name, location_label, mapbox_id, latitude, longitude)
  where u.email = v.user_email
    and s.title = v.service_title;
end $$;
