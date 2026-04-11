export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "3px double var(--ink)",
        padding: "20px 0",
        textAlign: "center",
        marginTop: 48,
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "var(--ink-light)",
            letterSpacing: "0.08em",
          }}
        >
          Claude Now — Claudeの最新情報を、あなたの言葉で。
        </div>
      </div>
    </footer>
  );
}
