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
      'https://mockmind-api.uifaces.co/content/human/214.jpg',
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
    location_input_text,
    location_label
  )
  select
    u.id,
    true,
    true,
    true,
    true,
    'GB',
    case u.email
      when 'local-pro-ada@manoula.test' then 'London Greater London SW1A 1AA'
      when 'local-pro-evelyn@manoula.test' then 'Manchester Greater Manchester M1 1AE'
    end,
    case u.email
      when 'local-pro-ada@manoula.test' then 'In-person and virtual'
      when 'local-pro-evelyn@manoula.test' then 'Virtual first with local visits'
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
    location_input_text = excluded.location_input_text,
    location_label = excluded.location_label;

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
end $$;
