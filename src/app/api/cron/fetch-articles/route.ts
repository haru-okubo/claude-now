import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase";
import { Resend } from "resend";
import type { Topic } from "@/lib/types";

export const maxDuration = 60;

const PROMPT = `You are an editor explaining Claude (by Anthropic) product updates to non-technical Japanese users.

Use web_search to fetch ALL THREE of these pages and aggregate the results:
1. https://docs.anthropic.com/en/release-notes/claude-apps  (Claude app features: claude.ai, mobile, desktop)
2. https://docs.anthropic.com/en/release-notes/api  (model updates, API changes)
3. https://www.anthropic.com/news  (major product announcements, new model launches)

STEP 1 — Fetch each page and list the exact date headings you find (format: "Month DD, YYYY"). Do not invent dates.

STEP 2 — Group all topics from all 3 sources by date. For the most recent 1-2 dates across all sources, produce the output below.
- If the same announcement appears on multiple pages, include it only once.
- Include ALL product launches, new features, and new services — even if announced on anthropic.com/news (e.g. new agents, new products, major capability launches). These are the most important to capture.
- Exclude only truly internal/infrastructure changes (e.g. SDK bug fixes, internal tooling). When in doubt, include it.
- source field: "app" | "api" | "news"
- source_url: the direct URL to the specific announcement or release note entry (not just the homepage)
- impact: integer 1-5 (1=minor fix, 2=small improvement, 3=notable feature, 4=major feature, 5=landmark release)
- impact_desc: one short Japanese phrase explaining the impact level

RULES:
- Only dates that ACTUALLY appear on the fetched pages
- All text in Japanese
- No jargon, no hype — plain facts only
- day_summary: 4-6 sentences covering ALL topics for that day across all sources
- topics: every relevant topic from that date as a separate item
- audience_personal: true if useful for individual claude.ai / mobile / desktop users
- audience_business: true if useful for team/enterprise/admin users
- usecases: 2-3 concrete examples
- irrelevant_personal / irrelevant_business: honest statement of who this does NOT affect

CRITICAL: Your entire response must be ONLY a raw JSON array. No text before or after it. No markdown.

[{"date":"YYYY-MM-DD","day_summary":"4〜6文の日本語サマリー","topics":[{"title":"20字以内","summary":"2〜3文","source":"app","audience_personal":true,"audience_business":false,"impact":3,"impact_desc":"影響範囲の一言説明","usecases":["例1","例2"],"irrelevant_personal":"関係ない個人ユーザー","irrelevant_business":"関係ないビジネスユーザー","source_url":"https://..."}]}]`;

interface DayData {
  date: string;
  day_summary: string;
  topics: Topic[];
}

async function fetchAndSummarize(): Promise<DayData[]> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
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
      from: "Claude Now <noreply@claudenow.dev>",
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
