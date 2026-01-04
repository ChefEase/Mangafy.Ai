import { Client } from "@gradio/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reusable Gradio client
const clientPromise = Client.connect("black-forest-labs/FLUX.1-Kontext-Dev");

export async function POST(req) {
  try {
    const formData = await req.formData();

    const prompt = (formData.get("prompt") || "").toString();
    const guidance_scale = parseFloat((formData.get("guidance_scale") || "7.5").toString());
    const num_inference_steps = parseInt((formData.get("num_inference_steps") || "20").toString(), 10);
    const seed = parseInt((formData.get("seed") || "0").toString(), 10);

    const imageFile = formData.get("image");

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "Missing reference image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // File -> Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const client = await clientPromise;

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

    return new Response(JSON.stringify({ error: "Unexpected image data format from model", result }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generation error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
