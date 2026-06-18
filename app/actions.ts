"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function hideCalendarEvent(formData: FormData) {
  const eventId = formString(formData, "eventId");
  if (!eventId) {
    return;
  }

  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  await supabase
    .from("calendar_events")
    .update({ hidden_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("user_id", userId);

  revalidatePath("/today");
  revalidatePath("/record");
}

export async function setOpenLoopStatus(formData: FormData) {
  const loopId = formString(formData, "loopId");
  const noteId = formString(formData, "noteId");
  const nextStatus = formString(formData, "status");
  if (!loopId || (nextStatus !== "open" && nextStatus !== "done")) {
    return;
  }

  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  await supabase
    .from("open_loops")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", loopId)
    .eq("user_id", userId);

  revalidatePath("/open-loops");
  if (noteId) {
    revalidatePath(`/notes/${noteId}`);
  }
}

export async function deleteNote(formData: FormData) {
  const noteId = formString(formData, "noteId");
  if (!noteId) {
    return;
  }

  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  await supabase.from("notes").delete().eq("id", noteId).eq("user_id", userId);

  revalidatePath("/notes");
  revalidatePath("/open-loops");
  revalidatePath("/ask");
  redirect("/notes");
}
