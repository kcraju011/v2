import type { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "student" | "teacher" | "admin" | "employee" | "owner" | "super_admin";
export type PresenceStatus = "in" | "recent" | "out" | "auto_exited";

export type UserRecord = {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  role_id: number | null;
  department_id: number | null;
  role_name: string | null;
  department_name: string | null;
  status: string;
};

export type LiveAttendanceRow = {
  id: number;
  tenantId: string;
  userId: string;
  name: string;
  email: string;
  mobile: string | null;
  role: string;
  department: string;
  sessionId: number | null;
  sessionName: string | null;
  sessionStatus: string | null;
  attendanceDate: string;
  entryTime: string | null;
  exitTime: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceFromCenterM: number | null;
  status: PresenceStatus;
};

export type LiveLocationRow = {
  id: number;
  tenantId: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  sessionId: number | null;
  sessionName: string | null;
  latitude: number;
  longitude: number;
  distanceFromCenterM: number | null;
  createdAt: string;
  status: PresenceStatus;
};

type AttendanceAction = "entry" | "exit" | "auto_exited";

type AttendanceInput = {
  tenantId: string;
  userId: string;
  sessionId?: number | null;
  loginMethod?: string;
  latitude?: number | null;
  longitude?: number | null;
  attendanceLocationId?: number | null;
  address?: string | null;
  distanceFromCenterM?: number | null;
};

type LocationInput = {
  tenantId: string;
  userId: string;
  sessionId?: number | null;
  latitude: number;
  longitude: number;
  distanceFromCenterM?: number | null;
  movementM?: number | null;
  batteryLevel?: number | null;
  accuracyM?: number | null;
  source?: string;
};

type RegisterInput = {
  tenantId: string;
  fullName: string;
  email: string;
  password: string;
  mobile?: string | null;
  role: AppRole;
  roleId?: number | null;
  departmentId?: number | null;
};

type LoginInput = {
  tenantId: string;
  email: string;
  password: string;
};

type ReferenceMaps = {
  roles: Map<number, string>;
  departments: Map<number, string>;
};

function toNumberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function derivePresenceStatus(status: string, timestamp: string | null | undefined) {
  if (status === "auto_exited") return "auto_exited" as const;
  if (status === "out") return "out" as const;
  if (!timestamp) return "in" as const;
  const elapsedMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000;
  return elapsedMinutes <= 15 ? "recent" : "in";
}

function pickName(fullName: string | null | undefined, email: string | null | undefined) {
  return fullName?.trim() || email || "Unknown User";
}

async function loadReferenceMaps(supabase: SupabaseClient, tenantId: string): Promise<ReferenceMaps> {
  const [rolesResult, departmentsResult] = await Promise.all([
    supabase.from("roles").select("id, name").eq("tenant_id", tenantId),
    supabase.from("departments").select("id, name").eq("tenant_id", tenantId)
  ]);

  if (rolesResult.error) throw rolesResult.error;
  if (departmentsResult.error) throw departmentsResult.error;

  return {
    roles: new Map((rolesResult.data ?? []).map((row) => [Number(row.id), String(row.name)])),
    departments: new Map((departmentsResult.data ?? []).map((row) => [Number(row.id), String(row.name)]))
  };
}

function mapUserRow(
  row: {
    id: string;
    tenant_id: string;
    full_name: string;
    email: string;
    mobile: string | null;
    role_id: number | null;
    department_id: number | null;
    status: string;
  },
  references: ReferenceMaps
): UserRecord {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    full_name: row.full_name,
    email: row.email,
    mobile: row.mobile,
    role_id: row.role_id,
    department_id: row.department_id,
    role_name: row.role_id ? references.roles.get(Number(row.role_id)) ?? null : null,
    department_name: row.department_id ? references.departments.get(Number(row.department_id)) ?? null : null,
    status: row.status
  };
}

async function getUserProfileById(supabase: SupabaseClient, tenantId: string, userId: string) {
  const references = await loadReferenceMaps(supabase, tenantId);
  const { data, error } = await supabase
    .from("users")
    .select("id, tenant_id, full_name, email, mobile, role_id, department_id, status")
    .eq("tenant_id", tenantId)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapUserRow(data, references) : null;
}

export async function getUsers(supabase: SupabaseClient, tenantId: string) {
  const references = await loadReferenceMaps(supabase, tenantId);
  const { data, error } = await supabase
    .from("users")
    .select("id, tenant_id, full_name, email, mobile, role_id, department_id, status")
    .eq("tenant_id", tenantId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapUserRow(row, references));
}

export async function registerUser(supabase: SupabaseClient, input: RegisterInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        tenant_id: input.tenantId,
        full_name: input.fullName,
        mobile: input.mobile ?? "",
        role: input.role,
        role_id: input.roleId?.toString() ?? "",
        department_id: input.departmentId?.toString() ?? ""
      }
    }
  });

  if (error) throw error;

  const profile = data.user ? await getUserProfileById(supabase, input.tenantId, data.user.id) : null;
  return { auth: data, profile };
}

export async function loginUser(supabase: SupabaseClient, input: LoginInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password
  });

  if (error) throw error;
  if (!data.user) {
    throw new Error("Login succeeded without a Supabase user.");
  }

  const profile = await getUserProfileById(supabase, input.tenantId, data.user.id);
  return { auth: data, profile };
}

export async function markAttendance(supabase: SupabaseClient, input: AttendanceInput & { action?: AttendanceAction }) {
  const action = input.action ?? "entry";
  const nowIso = new Date().toISOString();

  if (action === "entry") {
    const { data: existingOpen, error: openError } = await supabase
      .from("attendance")
      .select("id, tenant_id, user_id, session_id, attendance_date, attendance_type, entry_time, exit_time, status")
      .eq("tenant_id", input.tenantId)
      .eq("user_id", input.userId)
      .eq("status", "in")
      .is("exit_time", null)
      .order("entry_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openError) throw openError;
    if (existingOpen) return existingOpen;

    const { data, error } = await supabase
      .from("attendance")
      .insert({
        tenant_id: input.tenantId,
        user_id: input.userId,
        session_id: input.sessionId ?? null,
        attendance_date: nowIso.slice(0, 10),
        attendance_type: "entry",
        entry_time: nowIso,
        login_method: input.loginMethod ?? "password",
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        attendance_location_id: input.attendanceLocationId ?? null,
        address: input.address ?? null,
        distance_from_center_m: input.distanceFromCenterM ?? null,
        status: "in"
      })
      .select("id, tenant_id, user_id, session_id, attendance_date, attendance_type, entry_time, exit_time, status")
      .single();

    if (error) throw error;
    return data;
  }

  const { data: openAttendance, error: selectError } = await supabase
    .from("attendance")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("user_id", input.userId)
    .eq("status", "in")
    .is("exit_time", null)
    .order("entry_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!openAttendance) {
    throw new Error("No open attendance record found for this user.");
  }

  const { data, error } = await supabase
    .from("attendance")
    .update({
      attendance_type: "exit",
      exit_time: nowIso,
      status: action === "auto_exited" ? "auto_exited" : "out",
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      distance_from_center_m: input.distanceFromCenterM ?? null,
      session_id: input.sessionId ?? null,
      updated_at: nowIso
    })
    .eq("id", openAttendance.id)
    .eq("tenant_id", input.tenantId)
    .select("id, tenant_id, user_id, session_id, attendance_date, attendance_type, entry_time, exit_time, status")
    .single();

  if (error) throw error;
  return data;
}

export async function trackLocation(supabase: SupabaseClient, input: LocationInput) {
  const { data, error } = await supabase
    .from("location_logs")
    .insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      session_id: input.sessionId ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      distance_from_center_m: input.distanceFromCenterM ?? null,
      movement_m: input.movementM ?? null,
      battery_level: input.batteryLevel ?? null,
      accuracy_m: input.accuracyM ?? null,
      source: input.source ?? "gps"
    })
    .select("id, tenant_id, user_id, session_id, latitude, longitude, distance_from_center_m, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function getLiveAttendance(supabase: SupabaseClient, tenantId: string) {
  const users = await getUsers(supabase, tenantId);
  const userById = new Map(users.map((user) => [user.id, user]));
  const { data: openSessions, error: sessionError } = await supabase
    .from("sessions")
    .select("id, name, status")
    .eq("tenant_id", tenantId)
    .eq("status", "open");

  if (sessionError) throw sessionError;

  const sessionById = new Map<number, { name: string; status: string }>();
  for (const session of openSessions ?? []) {
    sessionById.set(Number(session.id), { name: String(session.name), status: String(session.status) });
  }

  const sessionIds = [...sessionById.keys()];
  if (sessionIds.length === 0) return [] as LiveAttendanceRow[];

  const { data, error } = await supabase
    .from("attendance")
    .select(
      "id, tenant_id, user_id, session_id, attendance_date, attendance_type, entry_time, exit_time, latitude, longitude, distance_from_center_m, status, created_at"
    )
    .eq("tenant_id", tenantId)
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const userProfile = userById.get(String(row.user_id)) ?? null;
      const session = row.session_id ? sessionById.get(Number(row.session_id)) ?? null : null;
      const status = derivePresenceStatus(String(row.status), (row.entry_time as string | null | undefined) ?? (row.created_at as string | undefined));

      return {
        id: Number(row.id),
        tenantId: String(row.tenant_id),
        userId: String(row.user_id),
        name: userProfile ? pickName(userProfile.full_name, userProfile.email) : "Unknown User",
        email: userProfile?.email ?? "",
        mobile: userProfile?.mobile ?? null,
        role: userProfile?.role_name ?? "member",
        department: userProfile?.department_name ?? "Unassigned",
        sessionId: row.session_id as number | null,
        sessionName: session?.name ?? null,
        sessionStatus: session?.status ?? null,
        attendanceDate: String(row.attendance_date),
        entryTime: row.entry_time as string | null,
        exitTime: row.exit_time as string | null,
        latitude: row.latitude as number | null,
        longitude: row.longitude as number | null,
        distanceFromCenterM: toNumberOrNull(row.distance_from_center_m),
        status
      } satisfies LiveAttendanceRow;
    })
    .filter((row) => row.sessionStatus === "open");
}

export async function getLiveLocations(supabase: SupabaseClient, tenantId: string) {
  const users = await getUsers(supabase, tenantId);
  const userById = new Map(users.map((user) => [user.id, user]));
  const { data: openSessions, error: sessionError } = await supabase
    .from("sessions")
    .select("id, name, status")
    .eq("tenant_id", tenantId)
    .eq("status", "open");

  if (sessionError) throw sessionError;

  const sessionById = new Map<number, { name: string; status: string }>();
  for (const session of openSessions ?? []) {
    sessionById.set(Number(session.id), { name: String(session.name), status: String(session.status) });
  }

  const sessionIds = [...sessionById.keys()];
  if (sessionIds.length === 0) return [] as LiveLocationRow[];

  const { data, error } = await supabase
    .from("location_logs")
    .select("id, tenant_id, user_id, session_id, latitude, longitude, distance_from_center_m, created_at")
    .eq("tenant_id", tenantId)
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const latestByUser = new Map<string, LiveLocationRow>();

  for (const row of data ?? []) {
    const session = row.session_id ? sessionById.get(Number(row.session_id)) ?? null : null;
    const userProfile = userById.get(String(row.user_id)) ?? null;
    const mapped: LiveLocationRow = {
      id: Number(row.id),
      tenantId: String(row.tenant_id),
      userId: String(row.user_id),
      name: userProfile ? pickName(userProfile.full_name, userProfile.email) : "Unknown User",
      email: userProfile?.email ?? "",
      department: userProfile?.department_name ?? "Unassigned",
      sessionId: row.session_id as number | null,
      sessionName: session?.name ?? null,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      distanceFromCenterM: toNumberOrNull(row.distance_from_center_m),
      createdAt: String(row.created_at),
      status: derivePresenceStatus("in", row.created_at as string | undefined)
    };

    if (!latestByUser.has(mapped.userId)) {
      latestByUser.set(mapped.userId, mapped);
    }
  }

  return [...latestByUser.values()];
}
