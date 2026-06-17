export const SOFT_SUGGESTED_MIN_SECONDS = 60;
export const SOFT_SUGGESTED_MAX_SECONDS = 5 * 60;
export const ALLOWED_MAX_SECONDS = 20 * 60;
export const HARD_MAX_SECONDS = 25 * 60;
export const DIRECT_TRANSCRIPTION_MAX_BYTES = 25 * 1024 * 1024;
export const HARD_UPLOAD_MAX_BYTES = 100 * 1024 * 1024;
export const RECORDER_CHUNK_MS = 60 * 1000;

export function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}
