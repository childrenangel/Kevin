/* ============================================================
   api.js — utilidades compartidas de Fetch + auth
   ============================================================ */

const API = 'http://localhost:3000/api';

// ── Sesión ────────────────────────────────────────────────────
function getToken()      { return localStorage.getItem('token'); }
function getUser()       { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ── Guard: redirige a login si no hay sesión ──────────────────
function requireAuth() {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/index.html';
    return null;
  }
  return user;
}

// ── API Logger ────────────────────────────────────────────────
const _methodColor = {
  GET:    '#3b82f6',
  POST:   '#22c55e',
  PUT:    '#f59e0b',
  PATCH:  '#f97316',
  DELETE: '#ef4444',
};

function _apiLog(method, path, { body, status, response, error } = {}) {
  const color = _methodColor[method] || '#6b7280';
  const ok    = !error;
  const statusColor = ok ? '#22c55e' : '#ef4444';

  console.groupCollapsed(
    `%c ${method} %c ${path} %c ${status}`,
    `background:${color};color:#fff;font-weight:bold;padding:2px 8px;border-radius:4px;font-family:monospace`,
    `color:${color};font-weight:bold;font-family:monospace`,
    `background:${statusColor};color:#fff;font-size:11px;padding:1px 6px;border-radius:10px;font-family:monospace`
  );
  if (body !== undefined)
    console.log('%c body    ', 'color:#94a3b8;font-weight:bold;font-family:monospace', body);
  if (response !== undefined)
    console.log('%c response', 'color:#94a3b8;font-weight:bold;font-family:monospace', response);
  if (error !== undefined)
    console.log('%c error   ', 'color:#ef4444;font-weight:bold;font-family:monospace', error);
  console.groupEnd();
}

// ── Fetch wrapper con JWT ─────────────────────────────────────
async function api(path, opts = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers
  };

  const method = opts.method || 'GET';
  const body = opts.body ? JSON.parse(opts.body) : undefined;

  const res = await fetch(`${API}${path}`, { ...opts, headers });

  if (res.status === 401) {
    clearSession();
    window.location.href = '/index.html';
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    _apiLog(method, path, { body, status: res.status, error: data.message || 'Error en la solicitud' });
    throw new Error(data.message || 'Error en la solicitud');
  }

  _apiLog(method, path, { body, status: res.status, response: data });
  return data;
}

// ── Helpers de formato ────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ── Chips HTML ────────────────────────────────────────────────
function statusChip(val) {
  return `<span class="chip chip-${val}">${val.replace('_', ' ')}</span>`;
}

function priorityLabel(p) {
  const map = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' };
  return map[p] || p;
}

function categoryLabel(c) {
  const map = { general: 'General', technical: 'Técnico', billing: 'Facturación', appointment: 'Cita' };
  return map[c] || c;
}

// ── Modals ────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Botones data-close
document.addEventListener('click', e => {
  const id = e.target.dataset.close;
  if (id) closeModal(id);
});

// Click fuera del box
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});
