import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  // ✅ Log the incoming request body
  console.log("📦 Incoming body:", req.body);

  const { priceId, userId } = req.body;

  // ✅ Check if env variables are defined
  if (!process.env.NEXT_PUBLIC_SITE_URL || !process.env.STRIPE_SECRET_KEY) {
    console.error("❌ Missing environment variables");
    return res.status(500).json({ error: "Missing environment variables" });
  }

  // ✅ Check for missing request values
  if (!priceId || !userId) {
    console.error("❌ Missing priceId or userId");
    return res.status(400).json({ error: "Missing required fields: priceId or userId" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId, // Needed for webhook to know who paid
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription`,
    });

    console.log("✅ Stripe session created:", session.id);
    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("🔥 Stripe session creation failed:", err.message);
    res.status(500).json({ error: "Stripe checkout failed: " + err.message });
  }
}
