-- NI4E internal publication sales. Run in Supabase SQL Editor before enabling paid publications.
create table if not exists public.publication_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  publication_id uuid not null references public.site_content(id) on delete cascade,
  publication_title text not null,
  amount_kobo bigint not null check (amount_kobo >= 100),
  currency text not null default 'NGN' check (currency = 'NGN'),
  provider text not null default 'paystack',
  provider_reference text not null unique,
  provider_transaction_id text,
  status text not null default 'pending' check (status in ('pending','success','failed','abandoned')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists publication_purchases_user_idx on public.publication_purchases(user_id, created_at desc);
create index if not exists publication_purchases_publication_idx on public.publication_purchases(publication_id, status);
alter table public.publication_purchases enable row level security;
drop policy if exists "Users read own publication purchases" on public.publication_purchases;
create policy "Users read own publication purchases" on public.publication_purchases for select to authenticated using (auth.uid() = user_id);
revoke all on public.publication_purchases from anon, authenticated;
grant select on public.publication_purchases to authenticated;
-- Full publication PDFs for paid titles must be stored in a PRIVATE Supabase Storage bucket named publication-files.
insert into storage.buckets (id, name, public) values ('publication-files','publication-files',false) on conflict (id) do update set public = false;
-- Only authenticated NI4E admins may upload or inspect private source PDFs.
drop policy if exists "NI4E admins upload publication PDFs" on storage.objects;
create policy "NI4E admins upload publication PDFs" on storage.objects for insert to authenticated
with check (bucket_id = 'publication-files' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "NI4E admins update publication PDFs" on storage.objects;
create policy "NI4E admins update publication PDFs" on storage.objects for update to authenticated
using (bucket_id = 'publication-files' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (bucket_id = 'publication-files' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "NI4E admins read publication PDFs" on storage.objects;
create policy "NI4E admins read publication PDFs" on storage.objects for select to authenticated
using (bucket_id = 'publication-files' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
