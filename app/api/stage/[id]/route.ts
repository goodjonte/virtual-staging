import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;

  const { data: render, error } = await getSupabaseAdmin()
    .from("renders")
    .select("id, status, original_url, staged_url")
    .eq("id", id)
    .single();

  if (error || !render) {
    return NextResponse.json({ error: "Render not found" }, { status: 404 });
  }

  return NextResponse.json(render);
}
