import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(
      "<html><body><h1>無効なリンクです</h1></body></html>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("subscribers")
    .delete()
    .eq("token", token)
    .select()
    .single();

  if (error || !data) {
    return new NextResponse(
      "<html><body style='font-family:sans-serif;text-align:center;padding:60px;'><h1>配信停止リンクが無効です</h1><p>すでに解除済みか、リンクが無効です。</p></body></html>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    "<html><body style='font-family:sans-serif;text-align:center;padding:60px;'><h1>配信を停止しました</h1><p>Claude Now のメール配信を停止しました。<br>ご利用ありがとうございました。</p></body></html>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
