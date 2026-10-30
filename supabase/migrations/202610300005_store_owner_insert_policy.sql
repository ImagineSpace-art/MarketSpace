-- Owners need INSERT access for stores that are not yet present locally or remotely.
drop policy if exists "Store owner creates store" on public.stores;
create policy "Store owner creates store"
  on public.stores for insert to authenticated
  with check (auth.uid() = user_id);

-- Keep owner updates working during ad and storefront profile saves.
drop policy if exists "Store owner updates store" on public.stores;
create policy "Store owner updates store"
  on public.stores for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
