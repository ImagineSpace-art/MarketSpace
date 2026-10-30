create table if not exists public.chat_user_states (
  chat_id bigint not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_pinned boolean not null default false,
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

alter table public.chat_user_states enable row level security;

drop policy if exists "Users manage their own chat states" on public.chat_user_states;
create policy "Users manage their own chat states"
  on public.chat_user_states for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.chat_user_states to authenticated;
