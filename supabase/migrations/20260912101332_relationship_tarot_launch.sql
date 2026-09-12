-- Expand the existing order type without changing rows or RLS policies.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.one_time_order_inputs
  DROP CONSTRAINT one_time_order_inputs_product_type_check;
ALTER TABLE public.one_time_order_inputs
  ADD CONSTRAINT one_time_order_inputs_product_type_check
  CHECK (product_type IN ('rocni_horoskop', 'personal_map', 'relationship_tarot'));

-- Budget reservation and accounting are server operations, never public RPCs.
REVOKE EXECUTE ON FUNCTION public.reserve_ai_daily_request(date, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_daily_request(date, integer, text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_ai_request_outcome(date, text, text, boolean, bigint, bigint, bigint, bigint, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ai_request_outcome(date, text, text, boolean, bigint, bigint, bigint, bigint, bigint) TO service_role;
COMMIT;
