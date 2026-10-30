-- Persistent likes and comments for marketplace advertisements stored in stores.ads JSON.
create table if not exists public.ad_likes (
  ad_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ad_id, user_id)
);

alter table public.ad_likes enable row level security;

drop policy if exists "Ad likes are publicly readable" on public.ad_likes;
create policy "Ad likes are publicly readable" on public.ad_likes
  for select using (true);

drop policy if exists "Authenticated users can like ads" on public.ad_likes;
create policy "Authenticated users can like ads" on public.ad_likes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can remove their ad likes" on public.ad_likes;
create policy "Users can remove their ad likes" on public.ad_likes
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.ad_comments (
  id uuid primary key default gen_random_uuid(),
  ad_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.ad_comments enable row level security;

drop policy if exists "Ad comments are publicly readable" on public.ad_comments;
create policy "Ad comments are publicly readable" on public.ad_comments
  for select using (true);

drop policy if exists "Authenticated users can comment on ads" on public.ad_comments;
create policy "Authenticated users can comment on ads" on public.ad_comments
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete their ad comments" on public.ad_comments;
create policy "Users can delete their ad comments" on public.ad_comments
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists ad_likes_ad_id_idx on public.ad_likes(ad_id);
create index if not exists ad_comments_ad_id_created_idx on public.ad_comments(ad_id, created_at desc);
