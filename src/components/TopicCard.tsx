import type { Topic } from "@/lib/types";

const sourceLabels: Record<string, string> = {
  app: "Claude Apps",
  api: "API / Models",
  news: "Anthropic News",
};

function getAudienceClass(t: Topic) {
  if (t.audience_personal && t.audience_business) return "both";
  if (t.audience_personal) return "personal";
  if (t.audience_business) return "business";
  return "";
}

const borderColors: Record<string, string> = {
  personal: "#2B4C7E",
  business: "#2E6B4F",
  both: "#5A3E78",
};

const tagStyles: Record<string, { bg: string; color: string }> = {
  personal: { bg: "#2B4C7E", color: "white" },
  business: { bg: "#2E6B4F", color: "white" },
  both: { bg: "#5A3E78", color: "white" },
};

const tagLabels: Record<string, string> = {
  personal: "個人ユーザー向け",
  business: "ビジネス向け",
  both: "個人・ビジネス両方",
};

export default function TopicCard({ topic }: { topic: Topic }) {
  const audience = getAudienceClass(topic);
  const borderLeft = borderColors[audience] || "var(--rule)";
  const tag = tagStyles[audience];
  const tagLabel = tagLabels[audience] || "一般ユーザーには関係なし";

  const impact = topic.impact || 0;
  const dots = [1, 2, 3, 4, 5];

  const irrelevantParts = [
    topic.irrelevant_personal ? `個人：${topic.irrelevant_personal}` : "",
    topic.irrelevant_business ? `企業：${topic.irrelevant_business}` : "",
  ]
    .filter(Boolean)
    .join("　／　");

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--rule)",
        borderLeft: `4px solid ${borderLeft}`,
        padding: "20px 24px",
        marginBottom: 12,
      }}
    >
      {/* Tags row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.08em",
            padding: "3px 8px",
            background: tag?.bg || "var(--rule)",
            color: tag?.color || "var(--ink-light)",
          }}
        >
          {tagLabel}
        </span>
        {topic.source && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.08em",
              padding: "3px 8px",
              background: "var(--rule)",
              color: "var(--ink-light)",
            }}
          >
            {sourceLabels[topic.source] || topic.source}
          </span>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: "clamp(15px, 2vw, 18px)",
          fontWeight: 700,
          lineHeight: 1.45,
          marginBottom: 10,
        }}
      >
        {topic.title}
      </div>

      {/* Impact */}
      {impact > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "var(--ink-light)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            インパクト
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {dots.map((i) => (
              <span
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: i <= impact ? "var(--accent)" : "var(--rule)",
                  display: "inline-block",
                }}
              />
            ))}
          </div>
          {topic.impact_desc && (
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: "var(--ink-light)",
              }}
            >
              {topic.impact_desc}
            </span>
          )}
        </div>
      )}

      {/* Summary */}
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.8,
          color: "var(--ink)",
          marginBottom: 14,
        }}
      >
        {topic.summary}
      </div>

      {/* Usecases */}
      {topic.usecases && topic.usecases.length > 0 && (
        <div
          style={{
            background: "var(--accent-soft)",
            borderLeft: "3px solid var(--accent)",
            padding: "10px 14px",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--accent)",
              marginBottom: 5,
              textTransform: "uppercase",
            }}
          >
            こんな人に関係あります
          </div>
          <ul style={{ fontSize: 13, lineHeight: 1.75, listStyle: "none", padding: 0 }}>
            {topic.usecases.map((u, i) => (
              <li
                key={i}
                style={{ paddingLeft: "1em", textIndent: "-1em", marginBottom: 4 }}
              >
                ・{u.replace(/^[・•\-]\s*/, "")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Irrelevant */}
      {irrelevantParts && (
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-light)",
            paddingTop: 8,
            borderTop: "1px dashed var(--rule)",
            lineHeight: 1.65,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "var(--ink-light)",
              letterSpacing: "0.08em",
              marginRight: 4,
            }}
          >
            関係ない人：
          </span>
          {irrelevantParts}
        </div>
      )}

      {/* Source URL */}
      {topic.source_url && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--rule)",
          }}
        >
          <a
            href={topic.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--ink-light)",
              textDecoration: "none",
            }}
          >
            元記事を読む →
          </a>
        </div>
      )}
    </div>
  );
}
