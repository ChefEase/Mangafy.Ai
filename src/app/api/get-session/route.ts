import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Optional: for display only
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

    // just for UI display
    const priceId = session.line_items?.data?.[0]?.price?.id ?? null;
    const credits = priceId ? priceToCredits[priceId] ?? 0 : 0;

    return NextResponse.json(
      {
        paid: session.payment_status === "paid",
        status: session.status,
        credits, // display only
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Session fetch failed:", err);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}
