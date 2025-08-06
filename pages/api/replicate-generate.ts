import type { NextApiRequest, NextApiResponse } from "next";

const REPLICATE_MODEL_VERSION =
  "cjwbw/animagine-xl-3.1:6afe2e6b27dad2d6f480b59195c221884b6acc589ff4d05ff0e5fc058690fbb9";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const {
    prompt,
    negative_prompt = "nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark",
    width = 896,
    height = 1152,
    steps = 28,
    cfg_scale = 7,
    seed = -1,
    style_selector = "Anime",
    quality_selector = "Standard v3.1",
  } = req.body;

  try {
    // Create prediction
    const createResp = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL_VERSION,
        input: {
          prompt,
          negative_prompt,
          width,
          height,
          seed: seed === -1 ? undefined : seed,
          num_inference_steps: steps,
          guidance_scale: cfg_scale,
          style_selector,
          quality_selector,
        },
      }),
    });

    if (!createResp.ok) {
      const text = await createResp.text();
      console.error("Failed to create prediction:", text);
      return res.status(500).json({ error: "Failed to create replicate prediction", detail: text });
    }

    let prediction = await createResp.json();
    console.log("Initial prediction object:", prediction);

    // Poll until finished
    // Ensure we have the polling URL
const statusUrl = prediction.urls?.get;
if (!statusUrl) {
  console.warn("No polling URL in prediction:", prediction);
  return res.status(500).json({
    error: "Missing status URL from replicate prediction",
    prediction,
  });
}

while (prediction.status === "starting" || prediction.status === "processing") {
  await sleep(1000);
  const statusResp = await fetch(statusUrl, {
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN || ""}`,
    },
  });
  if (!statusResp.ok) {
    const text = await statusResp.text();
    console.error("Failed to poll prediction:", text);
    break;
  }
  prediction = await statusResp.json();
  console.log("Polled prediction status:", prediction.status);
}

let imageUrl: string | undefined;
if (Array.isArray(prediction.output) && prediction.output[0]) {
  imageUrl = prediction.output[0];
} else if (typeof prediction.output === "string") {
  imageUrl = prediction.output;
}

if (prediction.status !== "succeeded" || !imageUrl) {
  console.warn("Invalid prediction output:", prediction);
  return res.status(500).json({
    error: prediction?.error || "Replicate did not return a valid image URL",
    prediction,
  });
}

return res.status(200).json({
  image: { url: imageUrl },
  applied_style: style_selector,
});

  } catch (err: any) {
    console.error("Replicate API error:", err);
    return res.status(500).json({ error: err.message || "Replicate error" });
  }
}
