import { NextResponse } from "next/server";
import { processImage } from "@/utils/imageProcessor";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  try {
    const base64 = await processImage(file);
    return NextResponse.json({ imageUrl: base64 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}