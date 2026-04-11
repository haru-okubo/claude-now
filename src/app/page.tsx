"use client";

import { useEffect, useState } from "react";
import type { Article } from "@/lib/types";
import Masthead from "@/components/Masthead";
import SourceBar from "@/components/SourceBar";
import DateGroup from "@/components/DateGroup";
import SubscribeForm from "@/components/SubscribeForm";
import Footer from "@/components/Footer";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchArticles() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/articles");
      if (!res.ok) throw new Error("記事の取得に失敗しました");
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <>
      <Masthead />

      {/* Progress bar */}
      {loading && (
        <div style={{ height: 2, background: "var(--rule)" }}>
          <div
            style={{
              height: "100%",
              background: "var(--accent)",
              width: "60%",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
        <SourceBar loading={loading} onRefresh={fetchArticles} />

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#FFF0EE",
              border: "1px solid var(--accent)",
              padding: "12px 16px",
              margin: "16px 0",
              fontSize: 13,
              color: "var(--accent)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "2px solid var(--rule)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: "var(--ink-light)",
                letterSpacing: "0.1em",
              }}
            >
              最新情報を取得中...
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && articles.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              border: "1px dashed var(--rule)",
              margin: "28px 0",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
            <div
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 18,
                marginBottom: 8,
              }}
            >
              まだ記事がありません
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--ink-light)",
                lineHeight: 1.7,
              }}
            >
              Cronジョブが実行されると、ここに最新情報が表示されます。
            </div>
          </div>
        )}

        {/* Articles */}
        {!loading &&
          articles.map((article, i) => (
            <DateGroup key={article.id} article={article} isLatest={i === 0} />
          ))}

        <SubscribeForm />
      </div>

      <Footer />
    </>
  );
}
