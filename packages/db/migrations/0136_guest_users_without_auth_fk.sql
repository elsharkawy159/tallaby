-- 0136: keep guest checkout users outside Supabase Auth.
--
-- Guest shoppers are intentionally represented by a temporary public.users row
-- keyed by the guest_uid cookie. They do not have an auth.users account, so the
-- 0134 users_id_auth_users_fk prevents creating a guest cart or order.
--
-- A normal foreign key cannot express "must exist in auth.users unless
-- is_guest". Replace it with an auth.users delete trigger: authenticated users
-- retain 0134's cleanup behaviour, while guest rows remain valid until they are
-- merged into an account or otherwise deleted by the application.

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_auth_users_fk;

CREATE OR REPLACE FUNCTION public.delete_public_user_after_auth_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_public_user_after_auth_delete() FROM PUBLIC;

DROP TRIGGER IF EXISTS delete_public_user_after_auth_delete ON auth.users;
CREATE TRIGGER delete_public_user_after_auth_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_public_user_after_auth_delete();
