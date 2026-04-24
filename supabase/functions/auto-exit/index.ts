import { createClient } from "jsr:@supabase/supabase-js@2";

type AttendanceRow = {
  id: number;
  tenant_id: string;
  user_id: string;
  attendance_location_id: number | null;
  latitude: number | null;
  longitude: number | null;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

Deno.serve(async () => {
  const nowIso = new Date().toISOString();

  const { data: openAttendance, error: openError } = await supabase
    .from("attendance")
    .select("id, tenant_id, user_id, attendance_location_id, latitude, longitude")
    .eq("status", "in")
    .is("exit_time", null);

  if (openError) {
    return new Response(JSON.stringify({ ok: false, error: openError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const results: Array<{ attendanceId: number; action: string }> = [];

  for (const row of (openAttendance ?? []) as AttendanceRow[]) {
    const { data: latestLog } = await supabase
      .from("location_logs")
      .select("latitude, longitude, created_at")
      .eq("tenant_id", row.tenant_id)
      .eq("user_id", row.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestLog || !row.attendance_location_id) {
      continue;
    }

    const { data: location } = await supabase
      .from("attendance_locations")
      .select("id, latitude, longitude, radius_m")
      .eq("tenant_id", row.tenant_id)
      .eq("id", row.attendance_location_id)
      .maybeSingle();

    if (!location) {
      continue;
    }

    const distanceM = haversineMeters(
      latestLog.latitude,
      latestLog.longitude,
      location.latitude,
      location.longitude,
    );

    if (distanceM <= location.radius_m) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("attendance")
      .update({
        attendance_type: "exit",
        exit_time: nowIso,
        status: "auto_exited",
        latitude: latestLog.latitude,
        longitude: latestLog.longitude,
        distance_from_center_m: distanceM,
      })
      .eq("id", row.id)
      .eq("tenant_id", row.tenant_id);

    if (!updateError) {
      await supabase.from("audit_logs").insert({
        tenant_id: row.tenant_id,
        event_type: "auto_exit",
        actor_role: "system",
        target_user_id: row.user_id,
        details: {
          attendance_id: row.id,
          distance_from_center_m: distanceM,
          auto_exited_at: nowIso,
        },
      });

      results.push({ attendanceId: row.id, action: "auto_exited" });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { "content-type": "application/json" },
  });
});

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadius * c);
}
