import { NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

export async function POST() {
  const { error } = await supabase.rpc("import_daily_reports");

  if (error) {
    return NextResponse.json({ success: false, error });
  }

  return NextResponse.json({ success: true });
}