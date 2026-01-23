import Stripe from "stripe";
import supabaseAdmin from "@/utils/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Keep your mapping if you want (fast + simple).
// Later you can move this into Stripe Price metadata.
const priceToCredits: Record<string, number> = {
  "price_1SsTAzCzofb0Va6RvAHCXJRf": 1200,
  "price_1SsTDMCzofb0Va6RglYhZ2Xp": 3500,
  "price_1SsTEQCzofb0Va6RTi28brjc": 14400,
  "price_1SsTFhCzofb0Va6RfoeTz6j9": 42000,
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
    // ✅ Monthly recurring payments land here
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;

      const invoiceId = (invoice as any).id as string;
      const subscriptionId = (invoice as any).subscription as string | null;


      // 1) Prevent double-processing (Stripe can retry events)
      const { data: alreadyProcessed, error: checkErr } = await supabaseAdmin
        .from("processed_stripe_invoices")
        .select("invoice_id")
        .eq("invoice_id", invoiceId)
        .maybeSingle();

      if (checkErr) {
        console.error("❌ Failed to check processed invoice:", checkErr.message);
        // return 200 so Stripe doesn’t retry forever if your DB hiccups
        return new Response("DB check failed", { status: 200 });
      }

      if (alreadyProcessed) {
        console.log("ℹ️ Invoice already processed:", invoiceId);
        return new Response("Already processed", { status: 200 });
      }

     // 2) Find userId via subscription metadata (best) with fallbacks
     let userId =
     (invoice as any)?.parent?.subscription_details?.metadata?.userId ||
     (invoice as any)?.lines?.data?.[0]?.metadata?.userId ||
     undefined;
   
// Try subscription metadata first
if (subscriptionId) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.metadata?.userId) userId = sub.metadata.userId;
}

// Fallback 1: invoice.subscription_details.metadata.userId
if (!userId) {
  userId = (invoice as any)?.parent?.subscription_details?.metadata?.userId as string | undefined;
}

// Fallback 2: invoice line item metadata.userId
if (!userId) {
  const lineUserId =
    (invoice as any)?.lines?.data?.[0]?.metadata?.userId as string | undefined;
  userId = lineUserId;
}

if (!userId) {
  console.warn("⚠️ No userId found anywhere for invoice:", invoiceId);
  return new Response("No userId", { status: 200 });
}

      // 3) Determine credits from invoice line items
      const lines = await stripe.invoices.listLineItems(invoiceId, { limit: 100 });

      let creditsToAdd = 0;

      for (const line of lines.data) {
        const anyLine = line as any;
      
        const priceId: string | undefined =
          anyLine?.price?.id ||
          anyLine?.pricing?.price_details?.price ||
          anyLine?.plan?.id;
      
        console.log("LINE PRICEID", {
          derivedPriceId: priceId,
          a: anyLine?.price?.id,
          b: anyLine?.pricing?.price_details?.price,
          c: anyLine?.plan?.id,
        });
      
        if (!priceId) continue;
      
        const price = await stripe.prices.retrieve(priceId);
        console.log("PRICE RETRIEVED", { priceId, metadata: price.metadata });
      
        const credits = Number(price.metadata?.credits || 0);
        console.log("CREDITS PARSED", { priceId, credits });
      
        if (!Number.isFinite(credits) || credits <= 0) continue;
      
        creditsToAdd += credits * (anyLine.quantity ?? 1);
      }
      

      if (creditsToAdd <= 0) {
        console.warn("⚠️ No credits found for invoice lines. invoice:", invoiceId);
        return new Response("No credits configured", { status: 200 });
      }

      // 4) Add credits (atomic)
      const { error: incErr } = await supabaseAdmin.rpc("increment_user_credits", {
        user_id: userId,
        amount: creditsToAdd,
      });

      if (incErr) {
        console.error("❌ Failed to increment credits:", incErr.message);
        return new Response("Credit increment failed", { status: 200 });
      }

      // 5) Mark invoice as processed
      const { error: insErr } = await supabaseAdmin.from("processed_stripe_invoices").insert({
        invoice_id: invoiceId,
        user_id: userId,
      });

      if (insErr) {
        console.error("❌ Failed to insert processed invoice:", insErr.message);
        // Not fatal, but it is important — could allow double credits if retried.
        // Still return 200 to prevent Stripe retries loop.
        return new Response("Processed insert failed", { status: 200 });
      }

      console.log(`✅ Added ${creditsToAdd} credits to user ${userId} for invoice ${invoiceId}`);
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
