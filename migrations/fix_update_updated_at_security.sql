-- fix: remove public API access from update_updated_at trigger function
--
-- Supabase flagged public.update_updated_at() as callable by the anon role
-- via /rest/v1/rpc/update_updated_at because it was created as SECURITY DEFINER
-- (Postgres default) without explicit REVOKE.
--
-- This function is a trigger — it is invoked by the database on row update,
-- never by API clients. Switching to SECURITY INVOKER and revoking EXECUTE
-- from anon + authenticated closes the exposure.

create or replace function public.update_updated_at()
returns trigger language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.update_updated_at() from anon;
revoke execute on function public.update_updated_at() from authenticated;
