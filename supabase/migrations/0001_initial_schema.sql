create extension if not exists vector;

create type note_kind as enum ('meeting_note', 'meeting_prep', 'free_note');
create type processing_status as enum ('pending', 'processing', 'processed', 'failed');
create type entity_type as enum ('person', 'company', 'project', 'topic');
create type open_loop_status as enum ('open', 'done', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  keep_raw_audio boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  provider_account_id text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  last_synced_at timestamptz,
  sync_status text not null default 'not_synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  provider_event_id text not null,
  title text not null,
  description text,
  location text,
  meeting_url text,
  attendees jsonb not null default '[]',
  starts_at timestamptz not null,
  ends_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_event_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  kind note_kind not null default 'free_note',
  transcript text,
  cleaned_text text,
  summary text,
  processing_status processing_status not null default 'pending',
  processing_error text,
  audio_storage_path text,
  audio_deleted_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.note_entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  entity_type entity_type not null,
  value text not null,
  normalized_value text generated always as (lower(trim(value))) stored,
  created_at timestamptz not null default now()
);

create table public.open_loops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_note_id uuid not null references public.notes(id) on delete cascade,
  description text not null,
  assignee text,
  due_hint text,
  status open_loop_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.note_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  content text not null,
  content_tsv tsvector generated always as (to_tsvector('english', content)) stored,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete cascade,
  job_type text not null,
  status processing_status not null default 'pending',
  attempts integer not null default 0,
  error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_events_user_starts_idx on public.calendar_events(user_id, starts_at);
create index notes_user_created_idx on public.notes(user_id, created_at desc);
create index note_entities_user_type_value_idx on public.note_entities(user_id, entity_type, normalized_value);
create index open_loops_user_status_idx on public.open_loops(user_id, status, created_at desc);
create index note_chunks_tsv_idx on public.note_chunks using gin(content_tsv);
create index note_chunks_embedding_idx on public.note_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.profiles enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notes enable row level security;
alter table public.note_entities enable row level security;
alter table public.open_loops enable row level security;
alter table public.note_chunks enable row level security;
alter table public.processing_jobs enable row level security;

create policy "profiles are user owned" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "calendar connections are user owned" on public.calendar_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "calendar events are user owned" on public.calendar_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes are user owned" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "note entities are user owned" on public.note_entities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "open loops are user owned" on public.open_loops
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "note chunks are user owned" on public.note_chunks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "processing jobs are user owned" on public.processing_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
