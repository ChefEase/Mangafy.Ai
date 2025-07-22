// pages/api/webhook.ts
import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import supabaseAdmin from "@/utils/supabaseAdmin";

export const config = {
  api: {
    bodyParser: false, // required for Stripe webhooks
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const sig = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: any) {
    console.error("❌ Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session?.metadata?.userId;
    const priceId = session?.metadata?.priceId;

    let credits = 0;
    switch (priceId) {
      case "price_1RnV3NCfqQf6EFEyrJGUcfkP": // your actual Stripe price IDs
        credits = 1200;
        break;
      case "price_1RnV5nCfqQf6EFEyvx3H79KA":
        credits = 3500;
        break;
        case "price_1RnV9mCfqQf6EFEyBT96MPqv":
            credits = 14400;
            break;
            case "price_1RnVCJCfqQf6EFEyvODEySQl":
                credits = 42000;
                break;
      default:
        credits = 0;
    }

    if (userId && credits > 0) {
      const { error } = await supabaseAdmin
        .from("users")
        .update({ credits: supabaseAdmin.rpc("increment_user_credits", {
          user_id: userId,
          amount: credits,
        }) })
        .eq("id", userId);

      if (error) {
        console.error("❌ Failed to update credits:", error.message);
        return res.status(500).json({ error: error.message });
      }

      console.log(`✅ Added ${credits} credits to user ${userId}`);
    }
  }

  res.status(200).json({ received: true });
}
