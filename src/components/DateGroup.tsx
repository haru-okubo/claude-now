import type { Article } from "@/lib/types";
import SummaryCard from "./SummaryCard";
import TopicCard from "./TopicCard";

interface DateGroupProps {
  article: Article;
  isLatest: boolean;
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export default function DateGroup({ article, isLatest }: DateGroupProps) {
  const dateStr = formatDate(article.date);

  return (
    <div
      style={{
        paddingTop: 36,
        ...(isLatest ? {} : { borderTop: "2px solid var(--ink)", marginTop: 36 }),
      }}
    >
      {/* Date label */}
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.2em",
          color: isLatest ? "var(--accent)" : "var(--ink-light)",
          textTransform: "uppercase",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {dateStr}
        {isLatest && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              background: "var(--accent)",
              color: "white",
              padding: "2px 6px",
              letterSpacing: "0.1em",
            }}
          >
            LATEST
          </span>
        )}
        <span
          style={{
            flex: 1,
            height: 1,
            background: "var(--rule)",
          }}
        />
      </div>

      <SummaryCard date={article.date} daySummary={article.day_summary} />

      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.15em",
          color: "var(--ink-light)",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        詳細
      </div>

      {article.topics.map((topic, i) => (
        <TopicCard key={i} topic={topic} />
      ))}
    </div>
  );
}
