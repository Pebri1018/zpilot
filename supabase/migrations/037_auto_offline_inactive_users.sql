-- 037_auto_offline_inactive_users.sql
-- Function to set users to Offline if last_active is > 1 hour ago

CREATE OR REPLACE FUNCTION public.cleanup_inactive_drivers()
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET status = 'Offline'
    WHERE status != 'Offline'
      AND last_active < (now() - interval '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users so they can trigger it during data fetch
GRANT EXECUTE ON FUNCTION public.cleanup_inactive_drivers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_inactive_drivers() TO service_role;
