import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  console.log("前端傳來:", apiKey);
  console.log("後端設定:", process.env.TWDS_API_KEY);

  if (!apiKey || apiKey !== process.env.TWDS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();

  const { data, error } = await supabase
    .from("daily_reports")
    .insert(body)
    .select();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    data,
  });
}