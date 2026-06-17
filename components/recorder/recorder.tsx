"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Send, Square } from "lucide-react";
import {
  ALLOWED_MAX_SECONDS,
  DIRECT_TRANSCRIPTION_MAX_BYTES,
  formatElapsedTime,
  HARD_MAX_SECONDS,
  HARD_UPLOAD_MAX_BYTES,
  RECORDER_CHUNK_MS,
  SOFT_SUGGESTED_MAX_SECONDS
} from "@/lib/recording/limits";

type CalendarEventOption = {
  id: string;
  title: string;
  starts_at: string;
};

export function Recorder({
  events,
  initialEventId
}: {
  events: CalendarEventOption[];
  initialEventId?: string;
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [kind, setKind] = useState("meeting_note");
  const [eventId, setEventId] = useState(initialEventId ?? "");
  const [status, setStatus] = useState("Ready");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [typedNote, setTypedNote] = useState("");

  const isLongNoteMode = elapsedSeconds >= SOFT_SUGGESTED_MAX_SECONDS;
  const isPastSuggestedRange = elapsedSeconds >= ALLOWED_MAX_SECONDS;
  const elapsedLabel = useMemo(() => formatElapsedTime(elapsedSeconds), [elapsedSeconds]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!startedAtRef.current) {
        return;
      }

      const nextElapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(nextElapsed);

      if (nextElapsed >= HARD_MAX_SECONDS) {
        stopRecording("Hard safety limit reached. Recording stopped at 25 minutes.");
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!audioBlob) {
      setAudioUrl(null);
      return;
    }

    const nextAudioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(nextAudioUrl);
    return () => URL.revokeObjectURL(nextAudioUrl);
  }, [audioBlob]);

  async function startRecording() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("Microphone access was blocked. Allow mic access and try again.");
      return;
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : undefined
    });
    chunksRef.current = [];
    setAudioBlob(null);
    setIsSubmitting(false);
    setElapsedSeconds(0);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start(RECORDER_CHUNK_MS);
    mediaRecorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setIsRecording(true);
    setStatus("Recording");
  }

  function stopRecording(nextStatus = "Recording saved locally") {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setStatus(nextStatus);
  }

  async function submitRecording() {
    if (isSubmitting) {
      return;
    }

    if (!audioBlob) {
      setStatus("Record audio first");
      return;
    }

    if (elapsedSeconds > HARD_MAX_SECONDS || audioBlob.size > HARD_UPLOAD_MAX_BYTES) {
      setStatus("Recording is over the MVP safety limit. Please record a shorter note.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    if (audioBlob.size <= DIRECT_TRANSCRIPTION_MAX_BYTES) {
      formData.append("audio", audioBlob, "note.webm");
    } else {
      chunksRef.current.forEach((chunk, index) => {
        formData.append("audioChunks", chunk, `note-part-${index + 1}.webm`);
      });
    }
    formData.append("kind", kind);
    formData.append("durationSeconds", elapsedSeconds.toString());
    if (eventId) {
      formData.append("calendarEventId", eventId);
    }

    setStatus("Uploading audio");
    const response = await fetch("/api/notes/transcribe", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setStatus(body?.error ?? "Upload failed");
      setIsSubmitting(false);
      return;
    }

    setStatus("Transcribing and organizing note");
    const body = (await response.json()) as { noteId: string };
    setStatus("Opening note");
    window.location.href = `/notes/${body.noteId}`;
  }

  async function submitTypedNote() {
    if (isSubmitting || !typedNote.trim()) {
      return;
    }

    setIsSubmitting(true);
    setStatus("Organizing typed note");
    const response = await fetch("/api/notes/text", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: typedNote,
        kind,
        calendarEventId: eventId || null
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setStatus(body?.error ?? "Typed note failed");
      setIsSubmitting(false);
      return;
    }

    const body = (await response.json()) as { noteId: string };
    window.location.href = `/notes/${body.noteId}`;
  }

  return (
    <div className="grid two recorder-layout">
      <div className="panel stack">
        <div className="field">
          <label htmlFor="note-kind">Note type</label>
          <select
            className="select"
            id="note-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="meeting_note">During or after meeting</option>
            <option value="meeting_prep">Before meeting prep</option>
            <option value="free_note">Free note</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="calendar-event">Calendar context</label>
          <select
            className="select"
            id="calendar-event"
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          >
            <option value="">No meeting attached</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} · {new Date(event.starts_at).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div className="recorder-action">
          {!isRecording ? (
            <button className="record-button" type="button" onClick={startRecording}>
              <Play size={18} aria-hidden="true" />
              Start recording
            </button>
          ) : (
            <button className="record-button is-recording" type="button" onClick={() => stopRecording()}>
              <Square size={18} aria-hidden="true" />
              Stop recording
            </button>
          )}
          <button className="icon-button" type="button" disabled aria-label="Pause recording">
            <Pause size={18} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={submitRecording}
            aria-label="Save note"
            disabled={isSubmitting || !audioBlob}
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>

        <label className="field">
          <span>Text fallback</span>
          <textarea
            className="textarea"
            value={typedNote}
            onChange={(event) => setTypedNote(event.target.value)}
            placeholder="Type a quick note if microphone access is unavailable."
          />
        </label>
        <button
          className="button secondary"
          type="button"
          onClick={submitTypedNote}
          disabled={isSubmitting || !typedNote.trim()}
        >
          Save typed note
        </button>
      </div>

      <aside className="panel stack">
        <h3>Status</h3>
        <p className="timer">
          {elapsedLabel} elapsed
        </p>
        <p className="muted">{status}</p>
        {isLongNoteMode ? (
          <div className="status">
            <strong>Long note mode active.</strong>
            <p className="muted">We'll process this in sections if needed.</p>
          </div>
        ) : null}
        {isPastSuggestedRange ? (
          <p className="muted">
            This is past the suggested 1-5 minute range. You can continue up to 25
            minutes.
          </p>
        ) : null}
        <p className="muted">
          Suggested: 1-5 minutes. Allowed: 20 minutes. Safety stop: 25 minutes.
        </p>
        {isSubmitting ? (
          <div className="status">
            <strong>Processing</strong>
            <p className="muted">Keep this tab open while MindMic creates the source note.</p>
          </div>
        ) : null}
        {audioBlob && audioUrl ? (
          <audio controls src={audioUrl} style={{ width: "100%" }}>
            <track kind="captions" />
          </audio>
        ) : null}
      </aside>
    </div>
  );
}
