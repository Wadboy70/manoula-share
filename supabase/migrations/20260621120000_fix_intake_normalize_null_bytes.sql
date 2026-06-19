-- Fix intake_normalize_text: replace(text, chr(0), '') errors on all inputs because
-- PostgreSQL does not permit U+0000 in text string arguments.

create or replace function public.intake_strip_null_bytes(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  v_bytes bytea;
  v_len integer;
  v_i integer;
  v_out bytea := ''::bytea;
begin
  v_bytes := convert_to(coalesce(p_value, ''), 'UTF8');
  v_len := octet_length(v_bytes);

  for v_i in 0..v_len - 1 loop
    if get_byte(v_bytes, v_i) <> 0 then
      v_out := v_out || substr(v_bytes, v_i + 1, 1);
    end if;
  end loop;

  return convert_from(v_out, 'UTF8');
end;
$$;

create or replace function public.intake_normalize_text(p_value text, p_max integer)
returns text
language sql
immutable
as $$
  select left(
    trim(
      public.intake_strip_null_bytes(
        regexp_replace(coalesce(p_value, ''), '<[^>]*>', '', 'g')
      )
    ),
    p_max
  );
$$;

revoke all on function public.intake_strip_null_bytes(text) from public;
