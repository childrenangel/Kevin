/* ============================================================
   dashboard.js — lógica principal del dashboard
   ============================================================ */

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  setupNavbar();
  setupLogout();
  buildTabs();
  await showTab('campaigns');
});

// ── Navbar ────────────────────────────────────────────────────
function setupNavbar() {
  document.getElementById('navUserName').textContent = currentUser.name;
  const badge = document.getElementById('navRoleBadge');
  badge.textContent = currentUser.role;
  badge.className   = `badge badge-${currentUser.role}`;
}

function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession();
    window.location.href = '/index.html';
  });
}

// ── TABS ─────────────────────────────────────────────────────
const TAB_CONFIG = [
  { id: 'campaigns',    label: 'Campañas',  roles: ['ADMIN','AGENT','USER'] },
  { id: 'appointments', label: 'Citas',     roles: ['ADMIN','AGENT','USER'] },
  { id: 'tickets',      label: 'Tickets',   roles: ['ADMIN','AGENT','USER'] },
  { id: 'users',        label: 'Usuarios',  roles: ['ADMIN'] }
];

function buildTabs() {
  const container = document.getElementById('tabsContainer');
  TAB_CONFIG
    .filter(t => t.roles.includes(currentUser.role))
    .forEach(tab => {
      const btn = document.createElement('button');
      btn.className   = 'tab-btn';
      btn.textContent = tab.label;
      btn.dataset.tab = tab.id;
      btn.addEventListener('click', () => showTab(tab.id));
      container.appendChild(btn);
    });
}

async function showTab(tabId) {
  // Marcar tab activo
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tabId)
  );
  // Ocultar todas las secciones
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  // Mostrar la seleccionada
  const sec = document.getElementById(`sec-${tabId}`);
  if (sec) sec.classList.remove('hidden');

  switch (tabId) {
    case 'campaigns':    await loadCampaigns();    break;
    case 'appointments': await loadAppointments(); break;
    case 'tickets':      await loadTickets();      break;
    case 'users':        await loadUsers();        break;
  }
}

// ══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ══════════════════════════════════════════════════════════════
async function loadCampaigns() {
  const el = document.getElementById('campaignsList');
  el.innerHTML = '<p class="loading-text">Cargando campañas…</p>';

  // Mostrar botón solo para ADMIN
  const btnNew = document.getElementById('btnNewCampaign');
  if (currentUser.role === 'ADMIN') {
    btnNew.classList.remove('hidden');
    btnNew.onclick = () => openModal('modalCampaign');
  }

  try {
    const campaigns = await api('/campaigns');
    if (!campaigns.length) {
      el.innerHTML = '<p class="empty-state">No hay campañas registradas.</p>';
      return;
    }
    el.innerHTML = '';
    campaigns.forEach(c => el.appendChild(campaignCard(c)));
  } catch (err) {
    el.innerHTML = `<p class="empty-state" style="color:red">${err.message}</p>`;
  }
}

function campaignCard(c) {
  const div = document.createElement('div');
  div.className = 'campaign-card';
  div.innerHTML = `
    <h4>${c.title}</h4>
    <p>${c.description || 'Sin descripción'}</p>
    <p>📍 ${c.location || 'Sin ubicación'} &nbsp;|&nbsp; 🎯 Meta: ${c.targetDonors} donantes</p>
    <p>🗓 ${fmtDateShort(c.startDate)} → ${fmtDateShort(c.endDate)}</p>
    <div class="campaign-meta">
      <span class="tag">${c.bloodType}</span>
      <span class="chip chip-${c.status}">${c.status}</span>
    </div>
  `;
  return div;
}

// Formulario nueva campaña
document.getElementById('formCampaign').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd   = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());
  try {
    await api('/campaigns', { method: 'POST', body: JSON.stringify(body) });
    closeModal('modalCampaign');
    e.target.reset();
    await loadCampaigns();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// ══════════════════════════════════════════════════════════════
// APPOINTMENTS
// ══════════════════════════════════════════════════════════════
async function loadAppointments() {
  const el = document.getElementById('appointmentsList');
  el.innerHTML = '<p class="loading-text">Cargando citas…</p>';

  document.getElementById('btnNewAppointment').onclick = async () => {
    // Cargar campañas en el select del modal
    await populateCampaignSelect();
    openModal('modalAppointment');
  };

  try {
    const appts = await api('/appointments');
    if (!appts.length) {
      el.innerHTML = '<p class="empty-state">No hay citas registradas.</p>';
      return;
    }
    el.innerHTML = '';
    appts.forEach(a => el.appendChild(appointmentRow(a)));
  } catch (err) {
    el.innerHTML = `<p class="empty-state" style="color:red">${err.message}</p>`;
  }
}

function appointmentRow(a) {
  const div = document.createElement('div');
  div.className = 'list-row';
  const userName = a.userId?.name || 'Usuario';
  const campName = a.campaignId?.title || 'Sin campaña';
  div.innerHTML = `
    <div class="list-row-info">
      <h4>${fmtDate(a.scheduledDate)}</h4>
      <p>👤 ${userName} &nbsp;|&nbsp; 📋 ${campName} &nbsp;|&nbsp; 🩸 ${a.bloodType || '—'}</p>
      ${a.notes ? `<p>📝 ${a.notes}</p>` : ''}
    </div>
    <div class="list-row-right">
      ${statusChip(a.status)}
    </div>
  `;
  return div;
}

async function populateCampaignSelect() {
  const sel = document.getElementById('apptCampaignSelect');
  sel.innerHTML = '<option value="">Sin campaña</option>';
  try {
    const camps = await api('/campaigns');
    camps.forEach(c => {
      const opt = document.createElement('option');
      opt.value       = c._id;
      opt.textContent = c.title;
      sel.appendChild(opt);
    });
  } catch (_) {}
}

document.getElementById('formAppointment').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd   = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());
  if (!body.campaignId) delete body.campaignId;
  try {
    await api('/appointments', { method: 'POST', body: JSON.stringify(body) });
    closeModal('modalAppointment');
    e.target.reset();
    await loadAppointments();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// ══════════════════════════════════════════════════════════════
// TICKETS
// ══════════════════════════════════════════════════════════════
async function loadTickets() {
  const el = document.getElementById('ticketsList');
  el.innerHTML = '<p class="loading-text">Cargando tickets…</p>';

  document.getElementById('btnNewTicket').onclick = () => openModal('modalTicket');

  try {
    const tickets = await api('/tickets');
    if (!tickets.length) {
      el.innerHTML = '<p class="empty-state">No hay tickets registrados.</p>';
      return;
    }
    el.innerHTML = '';
    tickets.forEach(t => el.appendChild(ticketRow(t)));
  } catch (err) {
    el.innerHTML = `<p class="empty-state" style="color:red">${err.message}</p>`;
  }
}

function ticketRow(t) {
  const div = document.createElement('div');
  div.className = `list-row clickable priority-${t.priority}`;
  div.innerHTML = `
    <div class="list-row-info">
      <h4>${t.title}</h4>
      <p>📂 ${categoryLabel(t.category)} &nbsp;|&nbsp; ⚡ ${priorityLabel(t.priority)} &nbsp;|&nbsp; 👤 ${t.createdBy?.name || '—'}</p>
      <p>🕒 ${fmtDate(t.createdAt)}</p>
    </div>
    <div class="list-row-right">
      ${statusChip(t.status)}
      <span style="font-size:.75rem;color:#999">${t.messages?.length || 0} msg</span>
    </div>
  `;
  div.addEventListener('click', () => {
    window.location.href = `/ticket-detail.html?id=${t._id}`;
  });
  return div;
}

document.getElementById('formTicket').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd   = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());
  try {
    await api('/tickets', { method: 'POST', body: JSON.stringify(body) });
    closeModal('modalTicket');
    e.target.reset();
    await loadTickets();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// ══════════════════════════════════════════════════════════════
// USERS (ADMIN only)
// ══════════════════════════════════════════════════════════════
async function loadUsers() {
  const el = document.getElementById('usersList');
  el.innerHTML = '<p class="loading-text">Cargando usuarios…</p>';
  try {
    const users = await api('/users');
    if (!users.length) {
      el.innerHTML = '<p class="empty-state">No hay usuarios.</p>';
      return;
    }
    el.innerHTML = '';
    users.forEach(u => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = `
        <div class="list-row-info">
          <h4>${u.name}</h4>
          <p>✉ ${u.email} &nbsp;|&nbsp; Registrado: ${fmtDateShort(u.createdAt)}</p>
        </div>
        <div class="list-row-right">
          <span class="badge badge-${u.role}">${u.role}</span>
          <span class="chip chip-${u.active ? 'confirmed' : 'cancelled'}">${u.active ? 'Activo' : 'Inactivo'}</span>
        </div>
      `;
      el.appendChild(row);
    });
  } catch (err) {
    el.innerHTML = `<p class="empty-state" style="color:red">${err.message}</p>`;
  }
}
