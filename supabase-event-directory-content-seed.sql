-- NI4E event directory content
-- Run after supabase-schema.sql and supabase-stage-3-integrated-event-payments.sql.
-- Adds three professionally presented, free-to-register events used by the public event directory.
-- Safe to re-run: stable IDs are upserted and existing unrelated content is untouched.

insert into public.site_content
  (id, content_type, title, slug, summary, body, metadata, published, event_start, event_end)
values
  ('9c7b9f21-9b1f-4b17-8b24-0d4c72a10001'::uuid, 'event', 'Annual General Engineering Conference', 'annual-general-engineering-conference',
   'A professional gathering for energy, electrical and electronics engineering practitioners, researchers, educators and emerging professionals.',
   'The Annual General Engineering Conference brings together professionals, researchers, industry partners and emerging engineers for technical exchange, institutional dialogue and collaboration across the energy, electrical and electronics engineering sectors. The programme is designed around engineering practice, infrastructure priorities, professional development and cross-sector collaboration.',
   '{"event_type":"Conference","venue":"Abuja, Nigeria","time":"9:00 AM – 4:30 PM","registration_open":true,"is_paid":false,"programme_tracks":["Power and energy infrastructure","Engineering practice and safety","Innovation and applied research","Professional development and collaboration"]}'::jsonb,
   true, '2027-06-17T09:00:00+01:00'::timestamptz, '2027-06-18T16:30:00+01:00'::timestamptz),
  ('9c7b9f21-9b1f-4b17-8b24-0d4c72a10002'::uuid, 'event', 'Power Systems & Grid Resilience Forum', 'power-systems-grid-resilience-forum',
   'A focused forum on grid reliability, power-system planning, renewable integration and resilient electricity infrastructure.',
   'This technical forum explores grid reliability, power-system planning, renewable integration, protection and control, infrastructure resilience and the engineering decisions that shape dependable electricity delivery. Attendees can expect technical presentations, applied case discussions and professional exchange around practical system challenges.',
   '{"event_type":"Technical Forum","venue":"Lagos, Nigeria","time":"9:00 AM – 3:30 PM","registration_open":true,"is_paid":false,"programme_tracks":["Grid reliability and planning","Protection and power quality","Renewable integration","Asset management and resilience"]}'::jsonb,
   true, '2027-03-12T09:00:00+01:00'::timestamptz, '2027-03-12T15:30:00+01:00'::timestamptz),
  ('9c7b9f21-9b1f-4b17-8b24-0d4c72a10003'::uuid, 'event', 'Emerging Engineers Professional Workshop', 'emerging-engineers-professional-workshop',
   'A practical workshop on engineering communication, professional ethics, technical reporting, project collaboration and career development.',
   'This professional-development workshop supports early-career engineers and students as they build sound habits in technical communication, ethical decision-making, technical reporting, project collaboration, safety awareness and career planning. Sessions combine practical examples with guided discussion and peer learning.',
   '{"event_type":"Workshop","venue":"Lagos, Nigeria","time":"10:00 AM – 2:30 PM","registration_open":true,"is_paid":false,"programme_tracks":["Professional ethics and responsibility","Technical reporting","Project collaboration","Career development"]}'::jsonb,
   true, '2027-02-20T10:00:00+01:00'::timestamptz, '2027-02-20T14:30:00+01:00'::timestamptz)
on conflict (id) do update set
  content_type = excluded.content_type,
  title = excluded.title,
  slug = excluded.slug,
  summary = excluded.summary,
  body = excluded.body,
  metadata = excluded.metadata,
  published = excluded.published,
  event_start = excluded.event_start,
  event_end = excluded.event_end,
  updated_at = now();

notify pgrst, 'reload schema';
