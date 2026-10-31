-- NI4E member profile photographs.
-- Public read is intentional so a member avatar can appear in the portal and
-- member directory; writes are restricted to the authenticated user's folder.
insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "NI4E member avatars are publicly readable" on storage.objects;
create policy "NI4E member avatars are publicly readable"
on storage.objects for select
using (bucket_id = 'member-avatars');

drop policy if exists "Members upload their own avatar" on storage.objects;
create policy "Members upload their own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members update their own avatar" on storage.objects;
create policy "Members update their own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members delete their own avatar" on storage.objects;
create policy "Members delete their own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
