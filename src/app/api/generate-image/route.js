// app/api/generate-image/route.js
import { Client } from "@gradio/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;

  // If this model/space requires auth, uncomment and set HF_TOKEN in .env.local
  // cachedClient = await Client.connect("black-forest-labs/FLUX.1-Kontext-Dev", {
  //   hf_token: process.env.HF_TOKEN,
  // });

  cachedClient = await Client.connect("black-forest-labs/FLUX.1-Kontext-Dev");
  return cachedClient;
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const prompt = String(formData.get("prompt") || "");
    const guidance_scale = parseFloat(String(formData.get("guidance_scale") || "7.5"));
    const num_inference_steps = parseInt(String(formData.get("num_inference_steps") || "20"), 10);
    const seed = parseInt(String(formData.get("seed") || "0"), 10);

    const imageFile = formData.get("image");
    if (!imageFile) {
      return new Response(JSON.stringify({ error: "Missing reference image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const client = await getClient();

    const result = await client.predict("/infer", {
      input_image: imageBuffer,
      prompt,
      seed,
      randomize_seed: false,
      guidance_scale,
      steps: num_inference_steps,
    });

    const resultData = result?.data?.[0];

    // Base64 output
    if (typeof resultData === "string" && resultData.startsWith("data:image")) {
      const buffer = Buffer.from(resultData.split(",")[1], "base64");
      return new Response(buffer, {
        headers: { "Content-Type": "image/png" },
        status: 200,
      });
    }

    // URL output
    if (resultData && typeof resultData === "object" && resultData.url) {
      const imageResponse = await fetch(resultData.url);
      const arr = await imageResponse.arrayBuffer();

      return new Response(Buffer.from(arr), {
        headers: { "Content-Type": "image/png" },
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({ error: "Unexpected image data format from model", result }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generation error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
