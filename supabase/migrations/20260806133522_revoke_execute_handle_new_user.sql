/*
# Revoke EXECUTE on trigger function from anon/authenticated roles

The handle_new_user() function is a trigger that should only be fired
by the database when a new auth user is created — it should never be
called directly via the REST API. Revoke EXECUTE from anon and
authenticated roles to close this surface.

1. Security changes
- REVOKE EXECUTE on handle_new_user() from anon, authenticated
- GRANT EXECUTE only to the postgres (superuser) role that fires the trigger
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
