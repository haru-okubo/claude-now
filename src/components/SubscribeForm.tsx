"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登録に失敗しました");
      setStatus("success");
      setMessage("登録完了！次回のアップデートからメールでお届けします。");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--bg)",
        padding: "28px 24px",
        marginTop: 20,
        marginBottom: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: "clamp(16px, 2.5vw, 20px)",
          fontWeight: 700,
          marginBottom: 6,
          color: "var(--bg)",
        }}
      >
        「結局なにが変わったの？」をメールで届けます
      </div>
      <div
        style={{
          fontSize: 13,
          color: "rgba(245,240,232,0.7)",
          lineHeight: 1.7,
          marginBottom: 16,
          maxWidth: 480,
          margin: "0 auto 16px",
        }}
      >
        専門用語なし・日本語だけのやさしいまとめを、新しい更新があった日にお届け。
        <br />
        読むだけでClaude の今がわかります。
      </div>

      {status === "success" ? (
        <div
          style={{
            fontSize: 14,
            color: "var(--bg)",
            padding: "12px",
            background: "rgba(245,240,232,0.1)",
          }}
        >
          {message}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
            style={{
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: 14,
              padding: "10px 16px",
              border: "1px solid rgba(245,240,232,0.3)",
              background: "rgba(245,240,232,0.08)",
              color: "var(--bg)",
              minWidth: 240,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 24px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              cursor: status === "loading" ? "not-allowed" : "pointer",
              opacity: status === "loading" ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {status === "loading" ? "登録中..." : "無料で受け取る"}
          </button>
        </form>
      )}

      {status === "error" && (
        <div
          style={{
            fontSize: 12,
            color: "var(--accent)",
            marginTop: 8,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
