alter table public.notes
  add column if not exists raw_transcript text,
  add column if not exists cleaned_note text,
  add column if not exists note_type note_kind not null default 'free_note';

update public.notes
set
  raw_transcript = coalesce(raw_transcript, transcript),
  cleaned_note = coalesce(cleaned_note, cleaned_text),
  note_type = coalesce(note_type, kind)
where raw_transcript is null
   or cleaned_note is null
   or note_type is distinct from kind;

alter table public.open_loops
  add column if not exists note_id uuid references public.notes(id) on delete cascade;

update public.open_loops
set note_id = coalesce(note_id, source_note_id)
where note_id is null;

create index if not exists open_loops_user_note_idx
  on public.open_loops(user_id, note_id, created_at desc);
