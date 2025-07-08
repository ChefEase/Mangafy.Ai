import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { projectId, title } = await request.json();
  // Save chapter to database
  return NextResponse.json({ success: true });
}

export async function GET() {
  // Fetch chapters from database
  return NextResponse.json([]);
}