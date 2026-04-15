-- Ensure auth signup trigger supplies country_code (NOT NULL on public.users after search migration).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, email, first_name, last_name, country_code)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'country_code'), ''),
      'NG'
    )
  );
  return new;
end;
$$;
