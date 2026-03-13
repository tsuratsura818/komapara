import Stripe from "stripe";

// Stripeクライアントシングルトン（サーバーサイド用）
let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe = new Stripe(key, {
    apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
  });
  return stripe;
}

// Stripe利用可能かチェック
export function isStripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
