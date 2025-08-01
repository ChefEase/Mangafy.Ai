import formidable from "formidable";
import fs from "fs";
import { Client } from "@gradio/client";
import { Blob }from "buffer";

export const config = {
  api: {
    bodyParser: false,
  },
};

const clientPromise = Client.connect("black-forest-labs/FLUX.1-Kontext-Dev");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(400).json({ error: "Error parsing form data" });
    }

    const imageArray = files.image;
    if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
      return res.status(400).json({ error: "Missing or invalid reference image" });
    }
    const imageFile = imageArray[0];

    const prompt = (fields.prompt && fields.prompt[0]) || "";
    const guidance_scale = parseFloat((fields.guidance_scale && fields.guidance_scale[0]) || "7.5");
    const num_inference_steps = parseInt((fields.num_inference_steps && fields.num_inference_steps[0]) || "20");
    const seed = parseInt((fields.seed && fields.seed[0]) || "0");

    try {
      const imagePath = imageFile.filepath;
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBlob = new Blob([imageBuffer], { type: imageFile.mimetype || "image/png" });

      const client = await clientPromise;

      const result = await client.predict("/infer", {
        input_image: imageBlob,
        prompt,
        seed,
        randomize_seed: false,
        guidance_scale,
        steps: num_inference_steps,
      });

      console.log("Gradio response data:", result.data);
      console.log("Type of result.data[0]:", typeof result.data[0]);
      console.log("Is Buffer:", Buffer.isBuffer(result.data[0]));

      if (!result.data || result.data.length === 0) {
        throw new Error("No data returned from model");
      }

      let outputImageBuffer;

      if (typeof result.data[0] === "string" && result.data[0].startsWith("data:image")) {
        outputImageBuffer = Buffer.from(result.data[0].split(",")[1], "base64");
      } else if (Buffer.isBuffer(result.data[0])) {
        outputImageBuffer = result.data[0];
      } else {
        console.error("Unexpected result.data content:", result.data[0]);
        throw new Error("Unexpected image data format from model");
      }

      res.setHeader("Content-Type", "image/png");
      return res.status(200).send(outputImageBuffer);

    } catch (error) {
      console.error("Generation error:", error);
      return res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
}
