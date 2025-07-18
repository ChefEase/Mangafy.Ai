import { NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';

const client = new InferenceClient(process.env.HF_TOKEN!); // Make sure HF_TOKEN is defined in .env

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request: "messages" must be an array.' },
        { status: 400 }
      );
    }

    // Call HF chat completion
    const chatCompletion = await client.chatCompletion({
      model: "Qwen/Qwen2.5-VL-7B-Instruct",
      messages: body.messages,
    });

    // Return only the message part
    
    console.log("🧠 HF Response:", JSON.stringify(chatCompletion, null, 2));
    return NextResponse.json(chatCompletion.choices?.[0]?.message || { content: "no response" });
  } catch (error: any) {
    console.error("🔥 Hugging Face API Error:", error);

    if (error instanceof Error && error.message.includes("401")) {
      return NextResponse.json({ error: "Invalid Hugging Face Token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal Server Error", detail: error.message || error },
      { status: 500 }
    );
  }
}
