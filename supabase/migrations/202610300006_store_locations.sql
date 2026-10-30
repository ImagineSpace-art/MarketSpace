create table if not exists public.marketplace_locations (
  id text primary key,
  name text not null unique,
  type text not null check (type in ('road', 'market', 'mall'))
);

insert into public.marketplace_locations (id, name, type) values
  ('cairo-road', 'Cairo Road', 'road'),
  ('chachacha-road', 'Chachacha Road', 'road'),
  ('lumumba-road', 'Lumumba Road', 'road'),
  ('dongwe-road', 'Dongwe Road', 'road'),
  ('tokyo-market', 'Tokyo Market', 'market'),
  ('city-market', 'City Market', 'market'),
  ('lima-tower', 'Lima Tower', 'market'),
  ('independence-avenue', 'Independence Avenue', 'road'),
  ('downtown-mall', 'Downtown Mall', 'mall'),
  ('cosmopolitan-mall', 'Cosmopolitan Mall', 'mall'),
  ('iringa-mall', 'Iringa Mall', 'mall'),
  ('makeni-mall', 'Makeni Mall', 'mall'),
  ('cairo-mall', 'Cairo Mall', 'mall'),
  ('east-park-mall', 'East Park Mall', 'mall'),
  ('novare-mall', 'Novare Mall', 'mall')
on conflict (id) do update set name = excluded.name, type = excluded.type;

alter table public.stores add column if not exists location_id text references public.marketplace_locations(id);
alter table public.stores add column if not exists location_name text;

update public.stores as stores
set location_id = locations.id,
    location_name = locations.name
from public.marketplace_locations as locations
where stores.location_id is null
  and coalesce(stores.address, '') ilike '%' || locations.name || '%';

alter table public.marketplace_locations enable row level security;
drop policy if exists "Marketplace locations are public" on public.marketplace_locations;
create policy "Marketplace locations are public" on public.marketplace_locations
  for select using (true);

create index if not exists stores_location_id_idx on public.stores(location_id);
create index if not exists stores_location_name_idx on public.stores(location_name);
