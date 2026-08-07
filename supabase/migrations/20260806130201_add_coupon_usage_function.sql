/*
# Add coupon usage increment function

Creates a SECURITY DEFINER function to increment the usage_count
of a coupon when it's redeemed. Callable by anon/authenticated.
*/

CREATE OR REPLACE FUNCTION increment_coupon_usage(code text)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET usage_count = usage_count + 1 WHERE coupons.code = code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_coupon_usage(text) TO anon, authenticated;
