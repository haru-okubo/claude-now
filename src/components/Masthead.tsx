"use client";

export default function Masthead() {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <header
      style={{
        borderBottom: "3px double var(--ink)",
        padding: "20px 0 16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          borderTop: "1px solid var(--ink)",
          margin: "0 24px 12px",
        }}
      />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.15em",
            color: "var(--ink-light)",
            marginBottom: 6,
          }}
        >
          {today}
        </div>
        <div
          style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Claude Now
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-light)",
            letterSpacing: "0.12em",
            marginTop: 6,
          }}
        >
          CLAUDEの最新情報を、あなたの言葉で。
        </div>
      </div>
      <div
        style={{
          borderBottom: "1px solid var(--ink)",
          margin: "12px 24px 0",
        }}
      />
    </header>
  );
}
