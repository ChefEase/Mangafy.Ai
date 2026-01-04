import Stripe from "stripe";
import supabaseAdmin from "@/utils/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const priceToCredits: Record<string, number> = {
  "price_1RnV3NCfqQf6EFEyrJGUcfkP": 1200,
  "price_1RnV5nCfqQf6EFEyvx3H79KA": 3500,
  "price_1RnV9mCfqQf6EFEyBT96MPqv": 14400,
  "price_1RnVCJCfqQf6EFEyvODEySQl": 42000,
};

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const rawBody = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error("❌ Webhook Error:", err?.message);
    return new Response(`Webhook Error: ${err?.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session?.metadata?.userId;
      const priceId = session?.metadata?.priceId;

      const credits = priceId ? priceToCredits[priceId] ?? 0 : 0;

      if (!userId) {
        console.warn("⚠️ Webhook missing userId in metadata");
      } else if (!credits) {
        console.warn("⚠️ Webhook unknown/zero credits for priceId:", priceId);
      } else {
        // ✅ Best: increment via RPC
        const { error } = await supabaseAdmin.rpc("increment_user_credits", {
          user_id: userId,
          amount: credits,
        });

        if (error) {
          console.error("❌ Failed to increment credits:", error.message);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        console.log(`✅ Added ${credits} credits to user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ Webhook handler failed:", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Webhook failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
