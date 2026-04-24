const SUPABASE_URL = 'https://bpwkqodasqcjbulkstrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd2txb2Rhc3FjamJ1bGtzdHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU5ODUsImV4cCI6MjA5MjU1MTk4NX0.FF13AdfO_Cpc8y7WKk3TJChlA98Hg5cb24WzBdVJ3_0';
const TENANT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const VALID_GUIDS = new Set(['2', '3']);

const TENANT_PROFILES = {
  '2': {
    success: true,
    guid: '2',
    tenant_id: 'sit',
    orgType: 'college',
    institution: {
      name: 'SIT',
      city: 'Tumakuru',
      logoUrl: 'https://web.sit.ac.in/wp-content/uploads/2025/03/SIT-Logo-1.png',
      website: 'https://web.sit.ac.in/',
      address: 'Siddaganga Institute of Technology'
    },
    application: {
      id: 101,
      name: 'Attendance monitoring',
      description: 'Biometric attendance for students, teachers and employees'
    }
  },
  '3': {
    success: true,
    guid: '3',
    tenant_id: 'ssit',
    orgType: 'college',
    institution: {
      name: 'SSIT',
      city: 'Tumakuru',
      logoUrl: 'https://ssit.edu.in/img/ssit-logo.png',
      website: 'https://ssit.edu.in/',
      address: 'Sri Siddhartha Institute of Technology'
    },
    application: {
      id: 102,
      name: 'Attendance monitoring',
      description: 'Biometric attendance for students, teachers and employees'
    }
  }
};

let markedUserId = null;
let registeredUid = null;
let teacherData = null;
let sessionTimer = null;
let liveSessionId = null;
let liveData = null;
let livePollTimer = null;
let liveLastSyncTime = '';
let liveTab = 'present';
let allStudents = [];
let historyData = [];
let deviceId = null;
let signedInUser = null;
let tenantState = {
  guid: '',
  tenantId: '',
  orgType: '',
  institution: {},
  application: {},
  roles: [],
  departments: [],
  attendanceLocations: []
};

let supabaseClient = null;

function readGuidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get('q') || '').trim();
}

function tenantCacheKey(guid) {
  return `tenant_${guid}`;
}

function setTenantLoading(on, text) {
  const box = document.getElementById('tenant-loader');
  const label = document.getElementById('tenant-loader-text');
  if (!box) return;
  if (label && text) label.textContent = text;
  box.style.display = on ? 'flex' : 'none';
}

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error('Supabase library not loaded');
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

function getCurrentTenantId() {
  return String(tenantState.tenantId || localStorage.getItem('tenant_id') || '').trim();
}

function setCurrentTenantId(value) {
  tenantState.tenantId = String(value || '').trim();
  try { localStorage.setItem('tenant_id', tenantState.tenantId); } catch (e) {}
  return tenantState.tenantId;
}

function getAuthToken() {
  try { return localStorage.getItem('ba_auth_token') || ''; } catch (e) { return ''; }
}

function getRefreshToken() {
  try { return localStorage.getItem('ba_refresh_token') || ''; } catch (e) { return ''; }
}

function getAuthExpiresAt() {
  try { return localStorage.getItem('ba_auth_expires_at') || ''; } catch (e) { return ''; }
}

function isAuthExpired() {
  const expiresAt = getAuthExpiresAt();
  if (!expiresAt) return false;
  const ms = Date.parse(expiresAt);
  return !Number.isNaN(ms) && Date.now() >= ms;
}

function authExpirySoon() {
  const expiresAt = getAuthExpiresAt();
  if (!expiresAt) return false;
  const ms = Date.parse(expiresAt);
  return !Number.isNaN(ms) && (ms - Date.now()) < 60000;
}

function scheduleAuthExpiry() {
  try {
    if (window.__ba_auth_expiry_timer) clearTimeout(window.__ba_auth_expiry_timer);
    const expiresAt = getAuthExpiresAt();
    if (!expiresAt) return;
    const delay = Date.parse(expiresAt) - Date.now();
    if (delay <= 0) { handleExpiredAuth(); return; }
    window.__ba_auth_expiry_timer = setTimeout(() => handleExpiredAuth(), delay);
  } catch (e) {}
}

async function handleExpiredAuth() {
  try { await getSupabase().auth.signOut(); } catch (e) {}
  clearTeacherSession();
}

function persistTeacherSession(data) {
  if (!data) return;
  try {
    localStorage.setItem('ba_teacher_session', JSON.stringify(data));
    if (data.authToken) localStorage.setItem('ba_auth_token', data.authToken);
    if (data.refreshToken) localStorage.setItem('ba_refresh_token', data.refreshToken);
    if (data.authExpiresAt) localStorage.setItem('ba_auth_expires_at', data.authExpiresAt);
    if (data.refreshExpiresAt) localStorage.setItem('ba_refresh_expires_at', data.refreshExpiresAt);
    if (data.userId) localStorage.setItem('ba_auth_user_id', String(data.userId));
    if (data.roleId) localStorage.setItem('ba_auth_role', String(data.roleId));
    scheduleAuthExpiry();
  } catch (e) {}
}

function clearTeacherSession() {
  try {
    ['ba_auth_token','ba_refresh_token','ba_auth_expires_at','ba_refresh_expires_at','ba_auth_user_id','ba_auth_role','ba_teacher_session']
      .forEach(key => localStorage.removeItem(key));
    if (window.__ba_auth_expiry_timer) clearTimeout(window.__ba_auth_expiry_timer);
  } catch (e) {}
  teacherData = null;
  signedInUser = null;
}

function toast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = '', 3500);
}

function setLoading(id, on) {
  const b = document.getElementById(id);
  if (!b) return;
  if (on) { b._h = b.innerHTML; b.innerHTML = '<span class="spin"></span> Please wait…'; b.disabled = true; }
  else { b.innerHTML = b._h || b.innerHTML; b.disabled = false; }
}

function togglePw(id) {
  const i = document.getElementById(id);
  if (i) i.type = i.type === 'password' ? 'text' : 'password';
}

function fmtTime(s) {
  const m = Math.floor(Math.max(0, s) / 60);
  const x = Math.max(0, s) % 60;
  return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
}

function readCachedTenant(guid) {
  try {
    const raw = localStorage.getItem(tenantCacheKey(guid));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.expiresAt || Date.now() > cached.expiresAt) return null;
    return cached.data || null;
  } catch (e) {
    return null;
  }
}

function cacheTenantProfile(guid, data) {
  try {
    localStorage.setItem(tenantCacheKey(guid), JSON.stringify({
      guid: String(guid),
      expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
      data
    }));
  } catch (e) {}
}

async function fetchTenantProfile(guid) {
  return VALID_GUIDS.has(String(guid || '').trim()) ? TENANT_PROFILES[String(guid).trim()] || null : null;
}

function applyTenantBranding(profile) {
  const institution = profile?.institution || {};
  const application = profile?.application || {};
  tenantState.guid = String(profile?.guid || tenantState.guid || readGuidFromUrl());
  tenantState.orgType = String(profile?.orgType || institution?.orgType || '').toLowerCase();
  tenantState.institution = institution;
  tenantState.application = application;
  setCurrentTenantId(profile?.tenant_id || '');
  window.TENANT = profile || null;

  const orgName = institution.name || 'BioAttend';
  const subtitle = application.description || 'Biometric Attendance System';
  const city = institution.city || tenantState.orgType || 'Organization';
  const logo = institution.logoUrl || '';

  document.title = `${orgName} | BioAttend`;
  const brandEl = document.getElementById('org-name');
  const tagEl = document.getElementById('org-tagline');
  const cityEl = document.getElementById('org-city-text');
  const teacherSubtitle = document.getElementById('teacher-dashboard-subtitle');
  const logoEl = document.getElementById('org-logo');
  const fallbackEl = document.getElementById('org-logo-fallback');

  if (brandEl) brandEl.textContent = orgName;
  if (tagEl) tagEl.textContent = subtitle;
  if (cityEl) cityEl.textContent = city;
  if (teacherSubtitle) teacherSubtitle.textContent = `Teacher Dashboard · ${orgName}`;
  if (logoEl && fallbackEl) {
    if (logo) {
      logoEl.src = logo;
      logoEl.style.display = 'block';
      fallbackEl.style.display = 'none';
      logoEl.onerror = () => { logoEl.style.display = 'none'; fallbackEl.style.display = 'block'; };
    } else {
      logoEl.style.display = 'none';
      fallbackEl.style.display = 'block';
    }
  }
}

function tenantSelect(table) {
  const tenantId = getCurrentTenantId();
  if (!tenantId) throw new Error('tenant_id is not set');
  return getSupabase().from(table).select('*').eq('tenant_id', tenantId);
}

function mapRoleRow(row) {
  return { role_id: row.role_id || row.id, name: row.name || row.key || '' };
}

function mapDepartmentRow(row) {
  return { department_id: row.department_id || row.id, name: row.name || '', in_charge: row.in_charge || '', email: row.email || '' };
}

function mapLocationRow(row) {
  return { attendance_location_id: row.attendance_location_id || row.id, name: row.name || '', latitude: row.latitude, longitude: row.longitude };
}

async function fetchRoleMap() {
  const { data, error } = await tenantSelect('roles');
  if (error) throw error;
  const map = {};
  (data || []).forEach(row => { map[String(row.id)] = String(row.key || row.name || '').toLowerCase(); });
  return map;
}

async function ensureProfile(user, payload) {
  if (!user?.id) return null;
  const tenantId = getCurrentTenantId();
  let { data } = await getSupabase().from('users').select('*').eq('id', user.id).eq('tenant_id', tenantId).maybeSingle();
  if (!data) {
    await getSupabase().from('users').upsert({
      id: user.id,
      tenant_id: tenantId,
      email: payload?.email || user.email || '',
      full_name: payload?.name || user.user_metadata?.full_name || user.email || 'User',
      department_id: payload?.departmentId || null,
      role_id: payload?.roleId || null,
      mobile: payload?.mobile || '',
      dob: payload?.dob || null,
      device_id: payload?.deviceId || '',
      biometric_credential_id: payload?.biometricCode || '',
      institute_id: payload?.instituteId || '',
      status: 'active'
    }).catch(() => null);
    const retry = await getSupabase().from('users').select('*').eq('id', user.id).eq('tenant_id', tenantId).maybeSingle();
    data = retry.data || null;
  }
  return data;
}

async function formatAuthResponse(authData, payload) {
  const session = authData?.session || null;
  const user = session?.user || authData?.user || null;
  const profile = await ensureProfile(user, payload);
  const roleMap = await fetchRoleMap().catch(() => ({}));
  const roleKey = roleMap[String(profile?.role_id || '')] || String(profile?.role_id || '').toLowerCase();
  return {
    success: true,
    userId: profile?.id || user?.id || '',
    name: profile?.full_name || user?.email || '',
    roleId: roleKey || '',
    roleKey: roleKey || '',
    deptId: profile?.department_id || '',
    authToken: session?.access_token || '',
    refreshToken: session?.refresh_token || '',
    authExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : '',
    refreshExpiresAt: '',
    deviceId: profile?.device_id || '',
    guid: tenantState.guid
  };
}

async function handleApiAction(payload) {
  const action = String(payload?.action || '').trim();
  const tenantId = getCurrentTenantId();
  switch (action) {
    case 'getRoles': {
      const { data, error } = await tenantSelect('roles');
      if (error) throw error;
      return { success: true, data: (data || []).map(mapRoleRow) };
    }
    case 'getDepartments': {
      const { data, error } = await tenantSelect('departments');
      if (error) throw error;
      return { success: true, data: (data || []).map(mapDepartmentRow) };
    }
    case 'getAttendanceLocations':
    case 'getLocations': {
      const { data, error } = await tenantSelect('attendance_locations');
      if (error) throw error;
      return { success: true, data: (data || []).map(mapLocationRow) };
    }
    case 'registerUser': {
      const auth = await getSupabase().auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            tenant_id: tenantId,
            full_name: payload.name || '',
            device_id: payload.deviceId || ''
          }
        }
      });
      if (auth.error) throw auth.error;
      await ensureProfile(auth.data.user, payload);
      return { success: true, userId: auth.data.user?.id || '', message: 'Account created successfully' };
    }
    case 'loginUser': {
      const auth = await getSupabase().auth.signInWithPassword({ email: payload.email, password: payload.password });
      if (auth.error) throw auth.error;
      return await formatAuthResponse(auth.data, payload);
    }
    case 'logout': {
      await getSupabase().auth.signOut();
      return { success: true };
    }
    case 'refreshToken': {
      const refreshed = await getSupabase().auth.refreshSession();
      if (refreshed.error) throw refreshed.error;
      return await formatAuthResponse(refreshed.data, payload);
    }
    case 'markEntry': {
      const now = new Date().toISOString();
      const active = await handleApiAction({ action: 'getActiveSession' });
      const { data, error } = await getSupabase().from('attendance').insert({
        tenant_id: tenantId,
        user_id: payload.userId,
        session_id: active.session?.session_id || null,
        attendance_date: now.slice(0, 10),
        attendance_type: 'entry',
        entry_time: now,
        login_method: payload.loginMethod || 'password',
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        address: payload.address || '',
        status: 'in'
      }).select('*').single();
      if (error) throw error;
      if (payload.latitude && payload.longitude) {
        await getSupabase().from('location_logs').insert({
          tenant_id: tenantId,
          user_id: payload.userId,
          session_id: active.session?.session_id || null,
          latitude: payload.latitude,
          longitude: payload.longitude,
          source: 'gps'
        }).catch(() => null);
      }
      return { success: true, attendanceId: data.id, message: 'Attendance marked', name: signedInUser?.name || '', date: now.slice(0, 10), time: new Date(now).toLocaleTimeString('en-GB'), latitude: payload.latitude || '', longitude: payload.longitude || '', location: payload.address || '', distanceFromCentre: data.distance_from_center_m || '' };
    }
    case 'markExit': {
      const current = await getSupabase().from('attendance').select('*').eq('tenant_id', tenantId).eq('user_id', payload.userId).eq('status', 'in').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (current.error) throw current.error;
      if (!current.data) return { success: false, message: 'No entry record found for today.' };
      const exitIso = new Date().toISOString();
      const update = await getSupabase().from('attendance').update({
        attendance_type: 'exit',
        exit_time: exitIso,
        latitude: payload.latitude || current.data.latitude,
        longitude: payload.longitude || current.data.longitude,
        address: payload.address || current.data.address,
        status: 'out'
      }).eq('tenant_id', tenantId).eq('id', current.data.id).select('*').single();
      if (update.error) throw update.error;
      return { success: true, message: 'Exit recorded', exitTime: new Date(exitIso).toLocaleTimeString('en-GB'), location: payload.address || '' };
    }
    case 'trackLocation': {
      await getSupabase().from('location_logs').insert({
        tenant_id: tenantId,
        user_id: payload.user_id || payload.userId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        source: 'gps'
      });
      return { success: true };
    }
    case 'getMyAttendance': {
      const { data, error } = await getSupabase().from('attendance').select('*').eq('tenant_id', tenantId).eq('user_id', payload.userId).order('attendance_date', { ascending: false }).limit(20);
      if (error) throw error;
      return { success: true, records: (data || []).map(row => ({ date: row.attendance_date, entryTime: row.entry_time ? new Date(row.entry_time).toLocaleTimeString('en-GB') : '', exitTime: row.exit_time ? new Date(row.exit_time).toLocaleTimeString('en-GB') : '', duration: '', loginMethod: row.login_method || '', address: row.address || '', distanceFromCentre: row.distance_from_center_m || '' })) };
    }
    case 'getStudents': {
      const roleMap = await fetchRoleMap();
      const { data, error } = await tenantSelect('users');
      if (error) throw error;
      const students = (data || []).filter(row => roleMap[String(row.role_id)] === 'student');
      return { success: true, students: students.map(row => ({ userId: row.id, name: row.full_name, email: row.email, department: row.department_id || '', mobile: row.mobile || '', hasBio: !!row.biometric_credential_id, hasDevice: !!row.device_id })) };
    }
    case 'createSession': {
      const now = new Date();
      const minutes = parseInt(payload.windowMinutes || 10, 10) || 10;
      const { data, error } = await getSupabase().from('sessions').insert({
        tenant_id: tenantId,
        teacher_id: payload.userId || teacherData?.userId || null,
        teacher_name: payload.teacherName || teacherData?.name || '',
        subject: payload.subject || '',
        session_date: now.toISOString().slice(0, 10),
        start_time: now.toISOString(),
        end_time: new Date(now.getTime() + minutes * 60000).toISOString(),
        status: 'open',
        window_minutes: minutes
      }).select('*').single();
      if (error) throw error;
      return { success: true, sessionId: data.id, subject: data.subject, startTime: data.start_time, endTime: data.end_time };
    }
    case 'closeSession': {
      const { error } = await getSupabase().from('sessions').update({ status: 'closed' }).eq('tenant_id', tenantId).eq('id', payload.sessionId);
      if (error) throw error;
      return { success: true };
    }
    case 'getActiveSession': {
      const now = new Date().toISOString();
      const { data, error } = await getSupabase().from('sessions').select('*').eq('tenant_id', tenantId).eq('status', 'open').lte('start_time', now).gte('end_time', now).order('start_time', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return { success: true, active: false };
      return { success: true, active: true, session: { session_id: data.id, subject: data.subject, start_time: data.start_time, end_time: data.end_time }, secondsLeft: Math.max(0, Math.round((new Date(data.end_time).getTime() - Date.now()) / 1000)) };
    }
    case 'getSessions': {
      const { data, error } = await getSupabase().from('sessions').select('*').eq('tenant_id', tenantId).order('start_time', { ascending: false }).limit(20);
      if (error) throw error;
      return { success: true, sessions: (data || []).map(row => ({ sessionId: row.id, subject: row.subject, date: row.session_date, startTime: row.start_time ? new Date(row.start_time).toLocaleTimeString('en-GB') : '', endTime: row.end_time ? new Date(row.end_time).toLocaleTimeString('en-GB') : '', status: row.status, presentCount: 0 })) };
    }
    case 'getDashboard':
    case 'getLiveAttendance':
    case 'getLiveUpdates': {
      const { data, error } = await getSupabase().from('live_attendance_dashboard').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      const activeUsers = [];
      const offlineUsers = [];
      (data || []).forEach(row => {
        const entry = { userId: row.user_id, name: row.full_name, email: row.email, department: row.department_name || '', entryTime: row.entry_time ? new Date(row.entry_time).toLocaleTimeString('en-GB') : '', exitTime: row.exit_time ? new Date(row.exit_time).toLocaleTimeString('en-GB') : '', lastSeenAt: row.last_seen_at || '', online: !!row.online, location: row.last_latitude != null && row.last_longitude != null ? { latitude: row.last_latitude, longitude: row.last_longitude } : null };
        if (String(row.attendance_status || '').toLowerCase() === 'in') activeUsers.push(entry); else offlineUsers.push(entry);
      });
      if (action === 'getDashboard') return { success: true, total: activeUsers.length + offlineUsers.length, presentCount: activeUsers.length, absentCount: offlineUsers.length, present: activeUsers, absent: offlineUsers };
      return { success: true, sessionId: payload.sessionId || '', totalIn: activeUsers.length, totalOut: offlineUsers.length, activeUsers, offlineUsers, recentlyExited: [], locations: (data || []).map(row => ({ userId: row.user_id, name: row.full_name, email: row.email, department: row.department_name || '', latitude: row.last_latitude, longitude: row.last_longitude, timestamp: row.last_seen_at, online: !!row.online })), updatedAt: new Date().toISOString(), syncedAt: new Date().toISOString() };
    }
    case 'getDailyStats': {
      return { success: true, totalPresent: 0, totalAbsent: 0, lateEntries: 0, avgAttendancePercent: 0, entryTrend: new Array(24).fill(0), exitTrend: new Array(24).fill(0) };
    }
    case 'getWeeklyStats': {
      const { data, error } = await getSupabase().from('weekly_attendance_summary').select('*').eq('tenant_id', tenantId).order('week_start', { ascending: false }).limit(7);
      if (error) throw error;
      return { success: true, series: (data || []).reverse().map(row => ({ date: row.week_start, present: row.unique_users || 0, late: 0, early: 0 })) };
    }
    case 'getAttendanceInsights': {
      return { success: true, lateEntries: [], earlyExits: [], frequentAbsentees: [] };
    }
    case 'getUserAttendanceSummary': {
      const profile = await getSupabase().from('users').select('*').eq('tenant_id', tenantId).eq('id', payload.userId).maybeSingle();
      const stats = await getSupabase().from('user_attendance_stats').select('*').eq('tenant_id', tenantId).eq('user_id', payload.userId).maybeSingle();
      return { success: true, userId: payload.userId, name: profile.data?.full_name || payload.userId, email: profile.data?.email || '', totalRecords: stats.data?.total_entries || 0, presentCount: stats.data?.total_entries || 0, lateEntries: 0, earlyExits: 0, attendancePercent: 0 };
    }
    case 'addDepartment': {
      const { data, error } = await getSupabase().from('departments').insert({ tenant_id: tenantId, name: payload.name, in_charge: payload.inCharge || '', email: payload.email || '' }).select('*').single();
      if (error) throw error;
      return { success: true, departmentId: data.id, message: 'Department added' };
    }
    case 'addAttendanceLocation': {
      const { data, error } = await getSupabase().from('attendance_locations').insert({ tenant_id: tenantId, name: payload.name, latitude: payload.latitude, longitude: payload.longitude, radius_m: payload.allowedDistance || 200 }).select('*').single();
      if (error) throw error;
      return { success: true, locationId: data.id, message: 'Location added' };
    }
    case 'addUserLocMap': {
      const { data, error } = await getSupabase().from('user_location_map').insert({ tenant_id: tenantId, user_id: payload.userId, attendance_location_id: payload.locationId, allowed_distance_m: payload.allowedDistance || 200 }).select('*').single();
      if (error) throw error;
      return { success: true, mapId: data.id, message: 'Mapping added' };
    }
    case 'exportAttendance': {
      const { data, error } = await getSupabase().from('attendance').select('*').eq('tenant_id', tenantId).limit(500);
      if (error) throw error;
      const header = ['id','user_id','attendance_date','attendance_type','entry_time','exit_time','login_method','address'];
      const lines = [header.join(',')].concat((data || []).map(row => [row.id,row.user_id,row.attendance_date,row.attendance_type,row.entry_time,row.exit_time,row.login_method,row.address].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')));
      return { success: true, csv: lines.join('\n'), rowCount: (data || []).length };
    }
    case 'forceExitUser': {
      const current = await getSupabase().from('attendance').select('*').eq('tenant_id', tenantId).eq('user_id', payload.userId).eq('status', 'in').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!current.data) return { success: false, message: 'No active attendance row found' };
      const { error } = await getSupabase().from('attendance').update({ status: 'out', attendance_type: 'exit', exit_time: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', current.data.id);
      if (error) throw error;
      return { success: true };
    }
    case 'beginWebAuthnRegistration':
    case 'finishWebAuthnRegistration':
    case 'beginWebAuthnLogin':
    case 'finishWebAuthnLogin':
      return { success: false, message: 'WebAuthn is not yet migrated in this Supabase test mode. Use password login/register for tenant testing.' };
    default:
      return { success: false, message: 'Unknown action: ' + action };
  }
}

async function api(payload) {
  try {
    if (isAuthExpired()) {
      await handleExpiredAuth();
      throw new Error('Session expired');
    }
    if (authExpirySoon()) {
      const refreshed = await getSupabase().auth.refreshSession().catch(() => null);
      if (refreshed?.data) persistTeacherSession(await formatAuthResponse(refreshed.data, {}));
    }
    return await handleApiAction(payload || {});
  } catch (error) {
    return { success: false, message: error?.message || String(error) };
  }
}

window.bioAttendRealtime = {
  attendanceChannel: null,
  subscribeAttendance(callback) {
    const tenantId = getCurrentTenantId();
    if (!tenantId) return null;
    const sb = getSupabase();
    if (this.attendanceChannel) {
      try { sb.removeChannel(this.attendanceChannel); } catch (e) {}
      this.attendanceChannel = null;
    }
    this.attendanceChannel = sb.channel('attendance-' + tenantId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `tenant_id=eq.${tenantId}` }, payload => {
        console.log('[realtime][attendance]', payload);
        if (typeof callback === 'function') callback(payload);
      })
      .subscribe();
    return this.attendanceChannel;
  },
  unsubscribeAttendance() {
    if (!this.attendanceChannel) return;
    try { getSupabase().removeChannel(this.attendanceChannel); } catch (e) {}
    this.attendanceChannel = null;
  }
};

async function bootTenant() {
  const guid = readGuidFromUrl();
  tenantState.guid = guid;
  setTenantLoading(true, 'Loading organization...');
  let invalidLink = false;
  try {
    if (!VALID_GUIDS.has(String(guid))) {
      invalidLink = true;
      throw new Error('Invalid tenant link');
    }
    const tenantProfile = await fetchTenantProfile(guid);
    if (!tenantProfile) throw new Error('Tenant profile is incomplete');
    applyTenantBranding({ ...tenantProfile, guid });
    cacheTenantProfile(guid, { ...tenantProfile, guid });
  } catch (e) {
    if (invalidLink) {
      const box = document.getElementById('tenant-loader');
      const label = document.getElementById('tenant-loader-text');
      if (label) label.textContent = 'Invalid tenant link';
      if (box) box.innerHTML = '<strong>Invalid link</strong><span>Please use a valid tenant URL with q=2 or q=3.</span>';
      return false;
    }
    const fallbackProfile = readCachedTenant(guid) || TENANT_PROFILES[String(guid)] || null;
    if (!fallbackProfile) return false;
    applyTenantBranding({ ...fallbackProfile, guid });
    toast('Using cached tenant configuration', 'warn');
  } finally {
    if (!invalidLink) setTenantLoading(false);
  }
  return true;
}
