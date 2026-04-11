"use client";

interface SourceBarProps {
  loading: boolean;
  onRefresh: () => void;
}

const mono = "'DM Mono', monospace";

export default function SourceBar({ loading, onRefresh }: SourceBarProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--rule)",
        padding: "12px 0",
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          color: "var(--ink-light)",
          fontFamily: mono,
        }}
      >
        ソース：
      </span>
      {["Claude Apps", "API / Models", "Anthropic News"].map((s) => (
        <span
          key={s}
          style={{
            fontFamily: mono,
            fontSize: 11,
            padding: "4px 10px",
            border: "1px solid var(--rule)",
            color: "var(--ink-light)",
          }}
        >
          {s}
        </span>
      ))}
      <button
        disabled={loading}
        onClick={onRefresh}
        style={{
          marginLeft: "auto",
          fontFamily: mono,
          fontSize: 11,
          padding: "6px 16px",
          background: "var(--accent)",
          color: "white",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "0.08em",
          opacity: loading ? 0.4 : 1,
          transition: "opacity 0.15s",
        }}
      >
        ↺ 再取得
      </button>
    </div>
  );
}
