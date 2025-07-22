// src/pages/api/get-session.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import supabase from "@/utils/supabaseClient"; // Make sure this imports correctly

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

// Mapping of Stripe price IDs to credits
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

    // Add credits in Supabase
    const { data, error } = await supabase
      .from("users")
      .update({ credits: supabase.rpc("increment_credits", { uid: userId, amount: creditsToAdd }) }) // OR manually do the math if no RPC
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({ error: "Failed to update user credits" });
    }

    res.status(200).json({ credits: creditsToAdd });
  } catch (err: any) {
    console.error("Stripe session fetch failed:", err);
    res.status(500).json({ error: "Failed to retrieve session" });
  }
}
