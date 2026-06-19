-- Intake RPCs are only callable via the submit-intake Edge Function after CAPTCHA verification.
revoke execute on function public.submit_client_intake(jsonb) from anon, authenticated;
revoke execute on function public.submit_professional_intake(jsonb) from anon, authenticated;

grant execute on function public.submit_client_intake(jsonb) to service_role;
grant execute on function public.submit_professional_intake(jsonb) to service_role;
