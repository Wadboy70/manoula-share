-- Local-only seed data for manual search testing.
-- Safe to run repeatedly.
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
      when 'local-pro-ada@manoula.test' then 'In-person and virtual'
      when 'local-pro-evelyn@manoula.test' then 'Virtual first with local visits'
    end,
    case u.email
      when 'local-pro-ada@manoula.test' then true
      when 'local-pro-evelyn@manoula.test' then true
    end,
    case u.email
      when 'local-pro-ada@manoula.test' then true
      when 'local-pro-evelyn@manoula.test' then false
    end,
    case u.email
      when 'local-pro-ada@manoula.test' then false
      when 'local-pro-evelyn@manoula.test' then true
    end
  from public.users u
  where u.email in ('local-pro-ada@manoula.test', 'local-pro-evelyn@manoula.test')
  on conflict (user_id) do update
  set
    is_profile_complete = excluded.is_profile_complete,
    is_public_searchable = excluded.is_public_searchable,
    is_active = excluded.is_active,
    is_approved = excluded.is_approved,
    country_code = excluded.country_code,
    location_label = excluded.location_label,
    offers_remote = excluded.offers_remote,
    offers_in_home = excluded.offers_in_home,
    offers_provider_location = excluded.offers_provider_location;

  with professional_ids as (
    select id
    from public.users
    where email in ('local-pro-ada@manoula.test', 'local-pro-evelyn@manoula.test')
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
      or
      (u.email = 'local-pro-evelyn@manoula.test' and s.slug in ('maternal-nutrition', 'pelvic-floor-therapy'))
    )
  where u.email in ('local-pro-ada@manoula.test', 'local-pro-evelyn@manoula.test')
  on conflict (professional_id, specialty_id) do nothing;

  with professionals as (
    select id, email
    from public.users
    where email in ('local-pro-ada@manoula.test', 'local-pro-evelyn@manoula.test')
  )
  delete from public.reviews r
  using professionals p
  where r.professional_id = p.id;

  insert into public.reviews (professional_id, reviewer_id, rating, review_text)
  select
    p.id,
    null,
    case
      when p.email = 'local-pro-ada@manoula.test' then 5
      else 4
    end,
    case
      when p.email = 'local-pro-ada@manoula.test'
        then 'Very supportive and practical guidance.'
      else 'Helpful and reassuring consultations.'
    end
  from public.users p
  where p.email in ('local-pro-ada@manoula.test', 'local-pro-evelyn@manoula.test');

  with professionals as (
    select id
    from public.users
    where email in ('local-pro-ada@manoula.test', 'local-pro-evelyn@manoula.test')
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
        6500::integer
      ),
      (
        'local-pro-ada@manoula.test',
        'postpartum-doula'::text,
        'Home visit — postpartum check-in'::text,
        'In-person support at your home within service area.'::text,
        'in_home'::text,
        12000::integer
      ),
      (
        'local-pro-evelyn@manoula.test',
        'maternal-nutrition'::text,
        'Clinic nutrition session'::text,
        'One-to-one session at our Manchester studio.'::text,
        'provider_location'::text,
        8500::integer
      )
  ) as v(email, specialty_slug, title, description, delivery_mode, price_cents)
  join public.specialties s on s.slug = v.specialty_slug
  where u.email = v.email;
end $$;
