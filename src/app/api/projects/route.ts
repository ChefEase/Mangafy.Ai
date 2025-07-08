import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { title, description, thumbnail } = await request.json();
  // Save project to database
  return NextResponse.json({ success: true });
}

export async function GET() {
  // Fetch projects from database
  return NextResponse.json([]);
}