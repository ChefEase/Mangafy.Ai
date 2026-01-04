import Stripe from "stripe";
import { NextResponse } from "next/server";
import supabase from "@/utils/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const priceToCredits: Record<string, number> = {
  "price_1RnV3NCfqQf6EFEyrJGUcfkP": 1200,
  "price_1RnV5nCfqQf6EFEyvx3H79KA": 3500,
  "price_1RnV9mCfqQf6EFEyBT96MPqv": 14400,
  "price_1RnVCJCfqQf6EFEyvODEySQl": 42000,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");

  if (!session_id) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    const userId = session.metadata?.userId;
    const priceId = session.line_items?.data?.[0]?.price?.id;

    if (!userId || !priceId) {
      return NextResponse.json({ error: "Missing userId or priceId" }, { status: 400 });
    }

    const creditsToAdd = priceToCredits[priceId];
    if (!creditsToAdd) {
      return NextResponse.json({ error: "Unknown priceId" }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("User fetch failed:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 500 });
    }

    const newCredits = (userData.credits || 0) + creditsToAdd;

    const { error: updateError } = await supabase
      .from("users")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateError) {
      console.error("Credit update failed:", updateError);
      return NextResponse.json({ error: "Failed to update user credits" }, { status: 500 });
    }

    return NextResponse.json({ credits: creditsToAdd }, { status: 200 });
  } catch (err) {
    console.error("Session fetch failed:", err);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}
