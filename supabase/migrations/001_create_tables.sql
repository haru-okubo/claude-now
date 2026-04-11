-- articles: 日付ごとのサマリー + トピック配列
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  day_summary text not null,
  topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- subscribers: メーリス登録者
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed boolean not null default false,
  token text not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now()
);

-- indexes
create index if not exists idx_articles_date on articles (date desc);
create index if not exists idx_subscribers_email on subscribers (email);
create index if not exists idx_subscribers_confirmed on subscribers (confirmed) where confirmed = true;

-- RLS
alter table articles enable row level security;
alter table subscribers enable row level security;

-- articles: anyone can read
create policy "articles_select" on articles for select using (true);

-- subscribers: only service role can read/write (via API routes)
-- No public policies needed; API uses service role key
