const mono = "'DM Mono', monospace";

export default function SourceBar() {
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
    </div>
  );
}
