import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if already registered
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, confirmed")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      if (existing.confirmed) {
        return NextResponse.json({ message: "すでに登録済みです" });
      }
      // Re-confirm if not confirmed yet
      await supabase
        .from("subscribers")
        .update({ confirmed: true })
        .eq("id", existing.id);
      return NextResponse.json({ message: "登録が完了しました" });
    }

    const { error } = await supabase.from("subscribers").insert({
      email: email.toLowerCase().trim(),
      confirmed: true,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "登録ありがとうございます！" });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "登録に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
