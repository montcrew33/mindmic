# Personal Meeting Brain

A lightweight MVP for private dictated meeting memory.

## Product Promise

Record a private thought in 10 seconds. The app transcribes it, organizes it, links it to the right meeting/person/project if possible, extracts open loops, and makes it searchable later.

## Architecture

- Next.js app and API routes
- Supabase Auth, Postgres, Storage, and Row Level Security
- Google Calendar API for optional calendar context
- Browser `MediaRecorder` for compressed private audio notes
- OpenAI transcription, note cleanup, structured extraction, embeddings, and cited answers
- Postgres full-text search plus pgvector semantic retrieval

## Getting Started

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and run `supabase/migrations/0001_initial_schema.sql`.
3. Add OpenAI and Google OAuth credentials.
4. Install dependencies and start the app:

```bash
npm install
npm run dev
```

The app intentionally treats the database as the source of truth. Raw audio is expected to be deleted after transcription unless a user setting keeps it.

## Recording Limits

- Soft suggested note length: 1-5 minutes
- Allowed max note length: 20 minutes
- Hard safety stop: 25 minutes
- Direct transcription path: files under 25 MB
- Long-note path: larger recordings are uploaded as recorder chunks and transcribed section by section

Later, realtime transcription should continuously save partial transcript text while recording, then run final cleanup/extraction when the user stops.
