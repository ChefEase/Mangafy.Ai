import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import supabase from "@/utils/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const priceToCredits: Record<string, number> = {
  "price_1RnV3NCfqQf6EFEyrJGUcfkP": 1200,
  "price_1RnV5nCfqQf6EFEyvx3H79KA": 3500,
  "price_1RnV9mCfqQf6EFEyBT96MPqv": 14400,
  "price_1RnVCJCfqQf6EFEyvODEySQl": 42000,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ error: "Missing or invalid session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    const userId = session.metadata?.userId;
    const priceId = session.line_items?.data[0]?.price?.id;

    if (!userId || !priceId) {
      return res.status(400).json({ error: "Missing userId or priceId" });
    }

    const creditsToAdd = priceToCredits[priceId];
    if (!creditsToAdd) {
      return res.status(400).json({ error: "Unknown priceId" });
    }

    // ✅ Step 1: Get current credits
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("User fetch failed:", userError);
      return res.status(500).json({ error: "User not found" });
    }

    // ✅ Step 2: Update credits
    const newCredits = (userData.credits || 0) + creditsToAdd;
    const { error: updateError } = await supabase
      .from("users")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateError) {
      console.error("Credit update failed:", updateError);
      return res.status(500).json({ error: "Failed to update user credits" });
    }

    res.status(200).json({ credits: creditsToAdd });
  } catch (err) {
    console.error("Session fetch failed:", err);
    res.status(500).json({ error: "Failed to retrieve session" });
  }
}
