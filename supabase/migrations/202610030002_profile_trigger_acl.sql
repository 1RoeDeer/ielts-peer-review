-- Trigger functions need not be callable through the public Data API.
-- The auth.users trigger continues to invoke this function after EXECUTE is revoked.
revoke all on function public.handle_new_user() from public, anon, authenticated;
