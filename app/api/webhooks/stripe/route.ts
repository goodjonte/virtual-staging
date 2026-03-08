import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PLANS } from "@/lib/stripe";
import Stripe from "stripe";

// Plan lookup by price ID
function getPlanByPriceId(priceId: string): { plan: string; limit: number } | null {
  for (const [key, val] of Object.entries(PLANS)) {
    if (val.priceId === priceId) {
      return { plan: key, limit: val.renders };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!email) break;

      // Get price ID from subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;
      const planInfo = getPlanByPriceId(priceId);

      if (!planInfo) break;

      await getSupabaseAdmin().from("users").update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan: planInfo.plan,
        renders_limit: planInfo.limit,
        renders_used: 0,
      }).eq("email", email);

      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0].price.id;
      const planInfo = getPlanByPriceId(priceId);
      if (!planInfo) break;

      await getSupabaseAdmin().from("users")
        .update({ plan: planInfo.plan, renders_limit: planInfo.limit })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await getSupabaseAdmin().from("users")
        .update({ plan: "free", renders_limit: 0, stripe_subscription_id: null })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    // Reset renders_used monthly
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      if (subId) {
        await getSupabaseAdmin().from("users")
          .update({ renders_used: 0 })
          .eq("stripe_subscription_id", subId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
