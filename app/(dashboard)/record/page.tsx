import { Suspense } from "react";
import { Recorder } from "@/components/recorder/recorder";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export default async function RecordPage({
  searchParams
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id,title,starts_at")
    .eq("user_id", userId)
    .gte("starts_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString())
    .order("starts_at", { ascending: true })
    .limit(30);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Private dictation</p>
          <h2 className="page-title">Record Note</h2>
          <p className="page-subtitle">
            Capture a short thought and optionally attach it to calendar context.
          </p>
        </div>
      </div>

      <Suspense>
        <Recorder events={events ?? []} initialEventId={eventId} />
      </Suspense>
    </section>
  );
}
