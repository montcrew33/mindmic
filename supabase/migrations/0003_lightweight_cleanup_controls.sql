alter table public.calendar_events
  add column if not exists hidden_at timestamptz;

create index if not exists calendar_events_user_visible_starts_idx
  on public.calendar_events(user_id, starts_at)
  where hidden_at is null;
