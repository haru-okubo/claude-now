export interface Topic {
  title: string;
  summary: string;
  source: "app" | "api" | "news";
  source_url: string;
  audience_personal: boolean;
  audience_business: boolean;
  impact: number;
  impact_desc: string;
  usecases: string[];
  irrelevant_personal: string;
  irrelevant_business: string;
}

export interface Article {
  id: string;
  date: string;
  day_summary: string;
  topics: Topic[];
  created_at: string;
}
