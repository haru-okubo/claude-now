import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase";
import { Resend } from "resend";
import type { Topic } from "@/lib/types";

export const maxDuration = 300;

// --- ソースごとの個別プロンプト ---

const SOURCES = [
  {
    id: "app" as const,
    url: "https://docs.anthropic.com/en/release-notes/claude-apps",
    label: "Claude Apps（claude.ai、モバイル、デスクトップの機能更新）",
  },
  {
    id: "api" as const,
    url: "https://docs.anthropic.com/en/release-notes/api",
    label: "API / Models（新モデル、API変更、開発者向け機能）",
  },
  {
    id: "news" as const,
    url: "https://www.anthropic.com/news",
    label: "Anthropic News（新製品発表、パートナーシップ、企業ニュース）",
  },
];

function buildPrompt(source: (typeof SOURCES)[number]) {
  return `あなたは「Claude Now」というメディアの編集長です。読者はITに詳しくない日本の一般ユーザー（会社員、学生、個人事業主など）です。

■ 作業
web_search で以下のページを取得し、直近 2〜3 日付分のトピックをすべてピックアップしてください。
URL: ${source.url}
内容: ${source.label}

1つも取りこぼさないこと。各日付セクションのすべての項目を列挙してください。

■ 書き方ルール

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

■ フィールド
- source: 固定で "${source.id}"
- source_url: 該当する記事/セクションへの直接URL
- audience_personal: 個人ユーザーに関係あるか
- audience_business: チーム/企業管理者に関係あるか
- impact: 1-5（1=軽微, 3=注目, 5=歴史的）
- irrelevant_personal / irrelevant_business: 関係ない人の説明

■ 出力: JSON配列のみ。前後にテキストやマークダウンを絶対に付けないこと。

[{"date":"YYYY-MM-DD","day_summary":"6〜10文","topics":[{"title":"25字以内","summary":"4〜6文","source":"${source.id}","audience_personal":true,"audience_business":false,"impact":3,"impact_desc":"一文","usecases":["シーン1","シーン2","シーン3"],"irrelevant_personal":"説明","irrelevant_business":"説明","source_url":"https://..."}]}]`;
}

interface DayData {
  date: string;
  day_summary: string;
  topics: Topic[];
}

async function fetchSource(
  client: Anthropic,
  source: (typeof SOURCES)[number]
): Promise<DayData[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: buildPrompt(source) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text) return [];

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const days: DayData[] = JSON.parse(jsonMatch[0]);
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return days.filter((day) => {
      if (!day.date || !day.topics || !Array.isArray(day.topics)) return false;
      const d = new Date(day.date);
      if (isNaN(d.getTime())) return false;
      if (d > now || d < oneYearAgo) return false;
      return true;
    });
  } catch {
    return [];
  }
}

// 3ソースの結果を日付でマージ
function mergeDays(allResults: DayData[][]): DayData[] {
  const byDate = new Map<string, DayData>();

  for (const days of allResults) {
    for (const day of days) {
      const existing = byDate.get(day.date);
      if (existing) {
        // トピックを追加、サマリーは長い方を採用
        existing.topics.push(...day.topics);
        if (day.day_summary.length > existing.day_summary.length) {
          existing.day_summary =
            existing.day_summary + "\n\n" + day.day_summary;
        }
      } else {
        byDate.set(day.date, { ...day, topics: [...day.topics] });
      }
    }
  }

  return Array.from(byDate.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// マージ後のday_summaryを再生成
async function regenerateSummaries(
  client: Anthropic,
  days: DayData[]
): Promise<DayData[]> {
  for (const day of days) {
    const topicTitles = day.topics.map((t) => t.title).join("、");
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `以下は ${day.date} のClaudeアップデート一覧です。これを非技術者の友達に口頭で説明するような6〜10文の日本語サマリーにまとめてください。専門用語は避け、「何ができるようになったか」を中心に書いてください。テキストのみ出力。マークダウン不可。

トピック: ${topicTitles}

各トピックの詳細:
${day.topics.map((t) => `- ${t.title}: ${t.summary}`).join("\n")}`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    if (text) {
      day.day_summary = text;
    }
  }
  return days;
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

  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50);
    await resend.emails.send({
      from: "Claude Now <noreply@mail.anchorup.jp>",
      to: batch,
      subject: `Claude Now — ${latestDay.date} のアップデート`,
      html,
    });
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret !== "your-cron-secret") {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const client = new Anthropic();
    const supabase = createServiceClient();

    // 既存の日付を取得（上書き防止）
    const { data: existingArticles } = await supabase
      .from("articles")
      .select("date");
    const existingDates = new Set(
      (existingArticles || []).map((a) => a.date)
    );

    // 3ソースを並列で取得
    const results = await Promise.all(
      SOURCES.map((source) => fetchSource(client, source))
    );

    // 日付でマージ
    let merged = mergeDays(results);

    // 既存日付を除外（上書きしない）
    merged = merged.filter((day) => !existingDates.has(day.date));

    if (merged.length === 0) {
      return NextResponse.json({
        message: "No new articles found",
        existingDates: Array.from(existingDates),
      });
    }

    // マージ後のday_summaryを再生成
    merged = await regenerateSummaries(client, merged);

    // 保存
    let newArticles = 0;
    for (const day of merged) {
      const { error } = await supabase.from("articles").insert({
        date: day.date,
        day_summary: day.day_summary,
        topics: day.topics,
      });

      if (error) {
        console.error(`Failed to insert ${day.date}:`, error);
      } else {
        newArticles++;
      }
    }

    if (newArticles > 0) {
      await sendNewsletter(merged);
    }

    return NextResponse.json({
      message: `Saved ${newArticles} new articles`,
      dates: merged.map((d) => d.date),
      skipped: Array.from(existingDates),
    });
  } catch (err) {
    console.error("Cron fetch-articles error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
