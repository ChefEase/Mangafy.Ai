// app/api/replicate-generate/route.ts
import { NextResponse } from "next/server";

const REPLICATE_MODEL_VERSION =
  "cjwbw/animagine-xl-3.1:6afe2e6b27dad2d6f480b59195c221884b6acc589ff4d05ff0e5fc058690fbb9";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
    } = body ?? {};

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

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
      return NextResponse.json(
        { error: "Failed to create replicate prediction", detail: text },
        { status: 500 }
      );
    }

    let prediction = await createResp.json();

    const statusUrl = prediction?.urls?.get;
    if (!statusUrl) {
      return NextResponse.json(
        { error: "Missing status URL from replicate prediction", prediction },
        { status: 500 }
      );
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
        return NextResponse.json(
          { error: "Failed to poll prediction", detail: text },
          { status: 500 }
        );
      }

      prediction = await statusResp.json();
    }

    let imageUrl: string | undefined;
    if (Array.isArray(prediction.output) && prediction.output[0]) {
      imageUrl = prediction.output[0];
    } else if (typeof prediction.output === "string") {
      imageUrl = prediction.output;
    }

    if (prediction.status !== "succeeded" || !imageUrl) {
      return NextResponse.json(
        { error: prediction?.error || "Replicate did not return a valid image URL", prediction },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        image: { url: imageUrl },
        applied_style: style_selector,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Replicate error" },
      { status: 500 }
    );
  }
}
