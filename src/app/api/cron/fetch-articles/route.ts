import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase";
import { Resend } from "resend";
import type { Topic } from "@/lib/types";

export const maxDuration = 120;

const PROMPT = `あなたは「Claude Now」というメディアの編集長です。読者はITに詳しくない日本の一般ユーザー（会社員、学生、個人事業主など）です。
読者が知りたいのは「自分にとって何が変わるのか」「明日から何ができるようになるのか」です。

■ 作業手順

STEP 1: web_search を使って以下の3ページを取得し、すべての日付見出しを列挙してください。
1. https://docs.anthropic.com/en/release-notes/claude-apps
2. https://docs.anthropic.com/en/release-notes/api
3. https://www.anthropic.com/news

STEP 2: 3ソース横断で直近 2〜3 日付分のトピックをすべてピックアップしてください。
- 同じ内容が複数ページにあれば1つにまとめる
- 新製品、新機能、新モデル、料金変更、UI変更 → すべて含める
- SDK内部バグ修正など完全に開発者内部の話だけ除外

STEP 3: 以下のJSON形式で出力してください。

■ 書き方ルール（最重要）

【day_summary】 6〜10文。その日の全トピックを「友達に口頭で説明する」くらいの温度感で。
- 悪い例: 「Managedエージェントが正式版になった」← 何のことかわからない
- 良い例: 「Claudeに"放っておいても勝手に仕事してくれる"機能（Managedエージェント）が正式に使えるようになりました。たとえば「毎朝このフォルダのファイルを整理して」みたいな指示を出しておくと、Claudeが自動でやってくれます。」

【topics.title】 25字以内。機能名ではなく「何ができるようになったか」で書く。
- 悪い例: 「ant CLIツール発表」
- 良い例: 「ターミナルからClaudeに直接指示できるように」

【topics.summary】 4〜6文。以下を必ず含める:
1. 何が変わったのか（ビフォー/アフター）
2. 具体的にどう使うのか（操作イメージ）
3. どんな人に嬉しいのか

【topics.usecases】 3〜4個。「〜な人が」「〜するとき」「〜できるようになった」の形で、具体的な生活/仕事シーンを描く。
- 悪い例: 「長時間の自動タスク処理」
- 良い例: 「毎週の経費レポートを、データを渡すだけでClaudeが自動で作成してくれるようになった」

【topics.impact_desc】 「誰に」「どのくらい」影響するかを1文で。
- 悪い例: 「企業の自動化業務」
- 良い例: 「Claudeを日常的に使っている人全員の操作感が変わるレベル」

■ その他のフィールド
- source: "app" | "api" | "news"
- source_url: 該当する記事/セクションへの直接URL
- audience_personal: 個人のclaude.ai/モバイル/デスクトップユーザーに関係あるか
- audience_business: チーム/企業管理者に関係あるか
- impact: 1-5 の整数（1=軽微な修正, 2=小さな改善, 3=注目すべき新機能, 4=大型機能, 5=歴史的リリース）
- irrelevant_personal: この機能が関係ない個人ユーザーの説明
- irrelevant_business: この機能が関係ないビジネスユーザーの説明

■ 出力形式
JSONの配列のみ。前後にテキストやマークダウンを絶対に付けないこと。

[{"date":"YYYY-MM-DD","day_summary":"6〜10文の日本語サマリー","topics":[{"title":"25字以内で何ができるようになったか","summary":"4〜6文の詳しい説明","source":"app","audience_personal":true,"audience_business":false,"impact":3,"impact_desc":"誰にどのくらい影響するか","usecases":["具体的シーン1","具体的シーン2","具体的シーン3"],"irrelevant_personal":"関係ない個人ユーザー","irrelevant_business":"関係ないビジネスユーザー","source_url":"https://..."}]}]`;

interface DayData {
  date: string;
  day_summary: string;
  topics: Topic[];
}

async function fetchAndSummarize(): Promise<DayData[]> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: PROMPT }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text) {
    throw new Error(
      "No text in response. Block types: " +
        response.content.map((b) => b.type).join(", ")
    );
  }

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response: " + text.slice(0, 300));
  }

  const days: DayData[] = JSON.parse(jsonMatch[0]);

  // Validate dates
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return days.filter((day) => {
    if (!day.date || !day.topics || !Array.isArray(day.topics)) return false;
    const d = new Date(day.date);
    if (isNaN(d.getTime())) return false;
    if (d > now) return false;
    if (d < oneYearAgo) return false;
    return true;
  });
}

async function sendNewsletter(days: DayData[]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "your-resend-api-key") return;

  const supabase = createServiceClient();
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email")
    .eq("confirmed", true);

  if (!subscribers || subscribers.length === 0) return;

  const resend = new Resend(apiKey);
  const emails = subscribers.map((s) => s.email);

  const latestDay = days[0];
  if (!latestDay) return;

  const topicsHtml = latestDay.topics
    .map(
      (t) => `
      <div style="margin-bottom:16px;padding:12px;border-left:3px solid #C84B2F;background:#FDFAF5;">
        <strong>${t.title}</strong>
        <p style="margin:4px 0;color:#6B6560;">${t.summary}</p>
      </div>`
    )
    .join("");

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#1A1612;">
      <h1 style="font-size:24px;border-bottom:2px solid #1A1612;padding-bottom:8px;">Claude Now</h1>
      <p style="color:#6B6560;font-size:13px;">Claudeの最新情報を、あなたの言葉で。</p>
      <div style="background:#1A1612;color:#F5F0E8;padding:20px;margin:16px 0;">
        <h2 style="font-size:18px;margin-bottom:8px;">${latestDay.date} のアップデート</h2>
        <p style="font-size:14px;line-height:1.8;">${latestDay.day_summary}</p>
      </div>
      ${topicsHtml}
      <p style="font-size:11px;color:#6B6560;margin-top:24px;border-top:1px solid #D4CEC4;padding-top:12px;">
        このメールは Claude Now の購読メールです。
        <a href="{{{unsubscribe_url}}}">配信停止はこちら</a>
      </p>
    </div>`;

  // Send in batches of 50
  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50);
    await resend.emails.send({
      from: "Claude Now <noreply@anchorup.jp>",
      to: batch,
      subject: `Claude Now — ${latestDay.date} のアップデート`,
      html,
    });
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret !== "your-cron-secret") {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const days = await fetchAndSummarize();

    if (days.length === 0) {
      return NextResponse.json({ message: "No valid data found" });
    }

    const supabase = createServiceClient();
    let newArticles = 0;

    for (const day of days) {
      const { error } = await supabase.from("articles").upsert(
        {
          date: day.date,
          day_summary: day.day_summary,
          topics: day.topics,
        },
        { onConflict: "date" }
      );

      if (error) {
        console.error(`Failed to upsert ${day.date}:`, error);
      } else {
        newArticles++;
      }
    }

    // Send newsletter if new articles were saved
    if (newArticles > 0) {
      await sendNewsletter(days);
    }

    return NextResponse.json({
      message: `Saved ${newArticles} articles`,
      dates: days.map((d) => d.date),
    });
  } catch (err) {
    console.error("Cron fetch-articles error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
