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
      setMessage("登録ありがとうございます！新着記事をメールでお届けします。");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--rule)",
        padding: "24px",
        marginTop: 32,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        メールで最新情報を受け取る
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-light)",
          lineHeight: 1.7,
          marginBottom: 16,
        }}
      >
        Claudeの新機能・アップデートを日本語でお届けします
      </div>

      {status === "success" ? (
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: "var(--accent)",
            padding: "12px",
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
            placeholder="you@example.com"
            required
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              padding: "8px 14px",
              border: "1px solid var(--rule)",
              background: "var(--bg)",
              color: "var(--ink)",
              minWidth: 240,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              padding: "8px 20px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              cursor: status === "loading" ? "not-allowed" : "pointer",
              opacity: status === "loading" ? 0.5 : 1,
              letterSpacing: "0.08em",
              transition: "opacity 0.15s",
            }}
          >
            {status === "loading" ? "登録中..." : "登録する"}
          </button>
        </form>
      )}

      {status === "error" && (
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
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
