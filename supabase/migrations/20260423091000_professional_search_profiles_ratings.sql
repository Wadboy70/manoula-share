-- Denormalized ratings on professional_search_profiles for anon-safe search sort.

alter table public.professional_search_profiles
  add column if not exists rating_avg numeric(4, 3),
  add column if not exists rating_count integer not null default 0;

comment on column public.professional_search_profiles.rating_avg is
  'Mean review rating (1–5); maintained by reviews trigger; anon-readable for search sort.';
comment on column public.professional_search_profiles.rating_count is
  'Number of reviews; maintained by reviews trigger.';

-- Backfill from existing reviews
update public.professional_search_profiles p
set
  rating_avg = round(r.avg::numeric, 3),
  rating_count = r.cnt
from (
  select
    professional_id,
    avg(rating::numeric) as avg,
    count(*)::integer as cnt
  from public.reviews
  group by professional_id
) r
where p.user_id = r.professional_id;

create or replace function public.professional_search_profiles_refresh_ratings_for_professional(
  p_professional_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_avg numeric;
  v_cnt integer;
begin
  select
    round(avg(rating::numeric), 3),
    count(*)::integer
  into v_avg, v_cnt
  from public.reviews
  where professional_id = p_professional_id;

  if v_cnt is null or v_cnt = 0 then
    update public.professional_search_profiles
    set rating_avg = null, rating_count = 0
    where user_id = p_professional_id;
  else
    update public.professional_search_profiles
    set rating_avg = v_avg, rating_count = v_cnt
    where user_id = p_professional_id;
  end if;
end;
$$;

create or replace function public.professional_search_profiles_reviews_rating_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_id bigint;
begin
  if tg_op = 'DELETE' then
    v_id := old.professional_id;
  else
    v_id := new.professional_id;
  end if;

  if tg_op = 'UPDATE' and old.professional_id is distinct from new.professional_id then
    perform public.professional_search_profiles_refresh_ratings_for_professional(old.professional_id);
  end if;

  perform public.professional_search_profiles_refresh_ratings_for_professional(v_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_refresh_professional_search_ratings on public.reviews;
create trigger reviews_refresh_professional_search_ratings
  after insert or update or delete on public.reviews
  for each row execute function public.professional_search_profiles_reviews_rating_trigger();

revoke all on function public.professional_search_profiles_refresh_ratings_for_professional(bigint) from public;
grant execute on function public.professional_search_profiles_refresh_ratings_for_professional(bigint) to service_role;

revoke all on function public.professional_search_profiles_reviews_rating_trigger() from public;
