import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const token = process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Missing Hugging Face token in environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Validation
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request: "messages" must be an array.' },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      baseURL: 'https://router.huggingface.co/v1',
      apiKey: token,
    });

    const chatCompletion = await client.chat.completions.create({
      model: 'Qwen/Qwen2.5-VL-7B-Instruct:hyperbolic',
      messages: body.messages,
    });

    return NextResponse.json(chatCompletion.choices?.[0]?.message || { content: 'no response' });
  } catch (error: any) {
    const statusCode =
      error?.status ||
      error?.response?.status ||
      (typeof error?.statusCode === 'number' ? error.statusCode : undefined);
    const message =
      (error instanceof Error && error.message) ||
      (typeof error === 'string' ? error : 'Unknown error');
    const detailSource = error?.response?.data ?? error?.response?.body ?? error?.cause;
    const detail =
      typeof detailSource === 'string'
        ? detailSource
        : detailSource
        ? JSON.stringify(detailSource, null, 2)
        : undefined;

    console.error('Hugging Face API Error:', { statusCode, message, detail, error });

    if (typeof message === 'string' && message.includes('401')) {
      return NextResponse.json({ error: 'Invalid Hugging Face Token' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: message,
        detail,
      },
      { status: statusCode || 500 }
    );
  }
}
