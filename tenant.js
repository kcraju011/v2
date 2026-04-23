// â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEFAULT_TENANT_API = 'https://script.google.com/macros/s/AKfycbzR-z38NrPZZm--4OeStiRvAgMb6SpwCjtb_GW0Rl9-/dev';

const NERVE_URL = 'https://script.google.com/macros/s/AKfycbwhFJ7oyLoed11sTYGikHyExxYs20J842q244K0MJ0VfwL5KgMDTb7E3uMN2sWhj0njYg/exec';

const TENANT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;


// â”€â”€ FALLBACK TENANTS (OFFLINE MODE) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FALLBACK_TENANTS = {

  '1': {
    success: true,
    guid: '1',
    orgType: 'college',
    institution: {
      name: 'BioAttend Main',
      city: 'Tumakuru',
      logoUrl: '',
      website: '',
      address: 'Main tenant workspace'
    },
    application: {
      id: 105,
      name: 'Attendance monitoring',
      description: 'Multi-tenant biometric attendance monitoring'
    },
    apiUrl: 'https://script.google.com/macros/s/AKfycby7Sz7KutpgfdbqCY9AvYfUmBs9QKOWiydT0eKj4TDFhVSC6cOKzk5YU3yHcrGYzdcbNg/exec'
  },

  '2': {
    success: true,
    guid: '2',
    orgType: 'college',
    institution: {
      name: 'SIT',
      city: 'Tumakuru',
      logoUrl: 'https://web.sit.ac.in/wp-content/uploads/2025/03/SIT-Logo-1.png',
      website: 'https://web.sit.ac.in/',
      address: 'Siddaganga Institute of Technology'
    },
    application: {
      id: 105,
      name: 'Attendance monitoring',
      description: 'Biometric attendance for students, teachers and employees'
    },
    apiUrl: 'https://script.google.com/macros/s/AKfycby7Sz7KutpgfdbqCY9AvYfUmBs9QKOWiydT0eKj4TDFhVSC6cOKzk5YU3yHcrGYzdcbNg/exec'
  },

  '3': {
    success: true,
    guid: '3',
    orgType: 'college',
    institution: {
      name: 'SSIT',
      city: 'Tumakuru',
      logoUrl: 'https://ssit.edu.in/img/ssit-logo.png',
      website: 'https://ssit.edu.in/',
      address: 'Sri Siddhartha Institute of Technology'
    },
    application: {
      id: 105,
      name: 'Attendance monitoring',
      description: 'Biometric attendance for multi-tenant institutions'
    },
    apiUrl: 'https://script.google.com/macros/s/AKfycbxVNcVsed50bZixWuAaC_CFRusRzbIvG5DyPa3ZEf2O0X4IFQoNRDYf-BWutrKYYTa7/exec'
  }
};

// â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let markedUserId  = null;
let registeredUid = null;
let teacherData   = null;
let sessionTimer  = null;
let liveSessionId = null;
let liveData      = null;
let liveTab       = 'present';
let allStudents   = [];
let historyData   = [];
let deviceId      = null;
let signedInUser  = null;
let TENANT_API    = DEFAULT_TENANT_API;
let tenantState   = {
  guid: '',
  orgType: '',
  institution: {},
  application: {},
  roles: [],
  departments: [],
  attendanceLocations: []
};

// â”€â”€ API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function readGuidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get('q') || '1').trim();
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

function jsonpRequest(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const cb = '__ba_jsonp_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const script = document.createElement('script');
    const sep = url.includes('?') ? '&' : '?';
    let timer = null;

    function cleanup() {
      if (timer) clearTimeout(timer);
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
    }

    window[cb] = data => {
      cleanup();
      resolve(data);
    };

    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to load tenant response'));
    };
    script.src = `${url}${sep}callback=${encodeURIComponent(cb)}`;
    document.head.appendChild(script);

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Tenant request timed out'));
    }, timeoutMs);
  });
}

function getAuthToken() {
  if (teacherData?.authToken) return teacherData.authToken;
  try {
    return localStorage.getItem('ba_auth_token') || '';
  } catch (e) {
    return '';
  }
}

function persistTeacherSession(data) {
  if (!data?.authToken) return;
  try {
    localStorage.setItem('ba_auth_token', data.authToken);
    localStorage.setItem('ba_teacher_session', JSON.stringify(data));
  } catch (e) {}
}

function clearTeacherSession() {
  try {
    localStorage.removeItem('ba_auth_token');
    localStorage.removeItem('ba_teacher_session');
  } catch (e) {}
}

async function api(payload) {
  if (!TENANT_API) throw new Error('Tenant API is not initialized');
  const requestPayload = { ...(payload || {}) };
  if (!requestPayload.guid && tenantState.guid) requestPayload.guid = tenantState.guid;
  if (!requestPayload.authToken) {
    const authToken = getAuthToken();
    if (authToken) requestPayload.authToken = authToken;
  }
  const url = TENANT_API + '?data=' + encodeURIComponent(JSON.stringify(requestPayload));
  console.log( "TENNANT API=" + url);
  
  return jsonpRequest(url);
}

// â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show ' + type;
  clearTimeout(t._t); t._t = setTimeout(() => t.className = '', 3500);
}

function setLoading(id, on) {
  const b = document.getElementById(id); if (!b) return;
  if (on) { b._h = b.innerHTML; b.innerHTML = '<span class="spin"></span> Please waitâ€¦'; b.disabled = true; }
  else { b.innerHTML = b._h || b.innerHTML; b.disabled = false; }
}

function togglePw(id) { const i = document.getElementById(id); i.type = i.type === 'password' ? 'text' : 'password'; }
function fmtTime(s) { const m = Math.floor(Math.max(0,s)/60), x = Math.max(0,s)%60; return String(m).padStart(2,'0')+':'+String(x).padStart(2,'0'); }

function getFallbackTenantProfile(guid) {
  return FALLBACK_TENANTS[String(guid || '').trim()] || null;
}

function getDefaultTenantProfile(guid) {
  const fallback = getFallbackTenantProfile(guid);
  if (fallback) return fallback;
  return {
    success: true,
    guid: String(guid || '1'),
    orgType: '',
    institution: {
      name: 'BioAttend',
      city: '',
      logoUrl: '',
      website: '',
      address: ''
    },
    application: {
      id: '',
      name: 'Attendance monitoring',
      description: 'Biometric attendance system'
    },
    apiUrl: DEFAULT_TENANT_API
  };
}

function readCachedTenant(guid) {
  try {
    const raw = localStorage.getItem(tenantCacheKey(guid));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.guid || String(cached.guid) !== String(guid)) return null;
    if (!cached?.expiresAt || Date.now() > cached.expiresAt) {
      localStorage.removeItem(tenantCacheKey(guid));
      return null;
    }
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
  if (NERVE_URL) {
    try {
      const joiner = NERVE_URL.includes('?') ? '&' : '?';
      const payload = await jsonpRequest(`${NERVE_URL}${joiner}getApplicationFromGuid=${encodeURIComponent(guid)}`);
      if (payload?.success && String(payload.guid || guid) === String(guid) && payload?.apiUrl) return payload;
    } catch (e) {
      console.warn('[tenant] Nerve lookup failed:', e);
    }
  }
  return getDefaultTenantProfile(guid);
}

function applyTenantBranding(profile) {
  const institution = profile?.institution || {};
  const application = profile?.application || {};
  tenantState.guid = String(profile?.guid || tenantState.guid || readGuidFromUrl());
  tenantState.orgType = String(profile?.orgType || institution?.orgType || '').toLowerCase();
  tenantState.institution = institution;
  tenantState.application = application;
  TENANT_API = profile?.apiUrl || DEFAULT_TENANT_API;
  window.TENANT_API = TENANT_API;
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
    logoEl.onload = () => {
      logoEl.style.display = 'block';
      fallbackEl.style.display = 'none';
    };
    logoEl.onerror = () => {
      logoEl.removeAttribute('src');
      logoEl.style.display = 'none';
      fallbackEl.style.display = 'block';
    };
    if (logo) {
      logoEl.referrerPolicy = 'no-referrer';
      logoEl.loading = 'eager';
      logoEl.src = logo;
      logoEl.style.display = 'block';
      fallbackEl.style.display = 'none';
    } else {
      logoEl.removeAttribute('src');
      logoEl.style.display = 'none';
      fallbackEl.style.display = 'block';
    }
  }
}

async function bootTenant() {
  const guid = readGuidFromUrl();
  tenantState.guid = guid;
  setTenantLoading(true, 'Loading organization...');
  try {
    console.info('[tenant] boot start', { guid });
    const cached = readCachedTenant(guid);
    const tenantProfile = cached || await fetchTenantProfile(guid);
    if (!tenantProfile?.apiUrl && !tenantProfile?.institution) throw new Error('Tenant profile is incomplete');
    applyTenantBranding({ ...tenantProfile, guid });
    cacheTenantProfile(guid, { ...tenantProfile, guid });
    await loadRegisterLookups();
  } catch (e) {
    console.warn('[tenant] boot fallback', e);
    applyTenantBranding({ ...getDefaultTenantProfile(guid), guid });
    toast('Using fallback tenant configuration', 'warn');
    await loadRegisterLookups();
  } finally {
    setTenantLoading(false);
  }
}

// â”€â”€ Tab navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

