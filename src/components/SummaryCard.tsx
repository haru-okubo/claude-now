interface SummaryCardProps {
  date: string;
  daySummary: string;
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

export default function SummaryCard({ date, daySummary }: SummaryCardProps) {
  const dateStr = formatDate(date);
  const paragraphs = daySummary
    .split(/。(?=\S)/)
    .filter(Boolean)
    .map((s) => (s.endsWith("。") ? s : s + "。"));

  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--bg)",
        padding: 32,
        marginBottom: 24,
        position: "relative",
      }}
    >
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "rgba(245,240,232,0.5)",
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        この日のまとめ
      </div>
      <div
        style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: "clamp(18px, 3vw, 26px)",
          fontWeight: 700,
          lineHeight: 1.45,
          marginBottom: 16,
          color: "var(--bg)",
        }}
      >
        {dateStr}のアップデート
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.9,
          color: "rgba(245,240,232,0.85)",
        }}
      >
        {paragraphs.map((p, i) => (
          <p key={i} style={{ marginTop: i > 0 ? 10 : 0 }}>
            {p}
          </p>
        ))}
      </div>
      <hr
        style={{
          border: "none",
          borderTop: "1px solid rgba(245,240,232,0.15)",
          margin: "20px 0",
        }}
      />
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: "rgba(245,240,232,0.4)",
          letterSpacing: "0.1em",
        }}
      >
        ↓ 各アップデートの詳細はこの下
      </div>
    </div>
  );
}
