import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PLANS = {
  starter: {
    name: "Starter",
    price: 29,
    renders: 20,
    priceId: process.env.STRIPE_PRICE_STARTER!,
    features: ["20 renders per month", "HD downloads", "Email support"],
  },
  pro: {
    name: "Pro",
    price: 79,
    renders: 100,
    priceId: process.env.STRIPE_PRICE_PRO!,
    features: ["100 renders per month", "HD downloads", "Priority support", "Multiple room styles"],
  },
  agency: {
    name: "Agency",
    price: 199,
    renders: 999999,
    priceId: process.env.STRIPE_PRICE_AGENCY!,
    features: ["Unlimited renders", "HD downloads", "Priority support", "Multiple room styles", "Team access"],
  },
};
