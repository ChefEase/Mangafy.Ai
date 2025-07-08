import { NextResponse } from "next/server";
import  supabase  from "@/utils/supabaseClient";

export async function POST(request: Request) {
  const { name, description, role, imageUrl } = await request.json();

  try {
    const { data, error } = await supabase
      .from("characters")
      .insert([{ name, description, role, image_url: imageUrl }])
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    );
  }
}