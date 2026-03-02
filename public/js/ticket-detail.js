/* ============================================================
   ticket-detail.js — lógica de la vista de un ticket
   ============================================================ */

let currentUser = null;
let ticketId    = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  setupNavbar();
  setupLogout();

  // Obtener ID del ticket de la URL
  const params = new URLSearchParams(window.location.search);
  ticketId = params.get('id');
  if (!ticketId) {
    window.location.href = '/dashboard.html';
    return;
  }

  await loadTicket();
  await loadRelated();
  setupStatusChange();
  setupMessageForm();
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

// ══════════════════════════════════════════════════════════════
// CARGAR TICKET
// ══════════════════════════════════════════════════════════════
async function loadTicket() {
  try {
    const t = await api(`/tickets/${ticketId}`);
    renderTicketHeader(t);
    renderMessages(t.messages || []);
    renderHistory(t.history || []);

    // Mostrar panel de cambio de estado para ADMIN y AGENT
    if (currentUser.role === 'ADMIN' || currentUser.role === 'AGENT') {
      const sec = document.getElementById('statusSection');
      sec.classList.remove('hidden');
      document.getElementById('statusSelect').value = t.status;
    }
  } catch (err) {
    document.getElementById('ticketHeader').innerHTML =
      `<p class="empty-state" style="color:red">Error: ${err.message}</p>`;
  }
}

function renderTicketHeader(t) {
  const div = document.getElementById('ticketHeader');
  div.innerHTML = `
    <h2 class="ticket-title">${t.title}</h2>
    <div class="ticket-meta-row">
      ${statusChip(t.status)}
      <span>📂 ${categoryLabel(t.category)}</span>
      <span>⚡ ${priorityLabel(t.priority)}</span>
      <span>👤 ${t.createdBy?.name || '—'}</span>
      ${t.assignedTo ? `<span>🎯 Asignado a: ${t.assignedTo.name}</span>` : ''}
      <span>🕒 ${fmtDate(t.createdAt)}</span>
    </div>
    <p class="ticket-description">${t.description}</p>
  `;
}

// ══════════════════════════════════════════════════════════════
// ENDPOINT HÍBRIDO: GET /tickets/:id/related
// ══════════════════════════════════════════════════════════════
async function loadRelated() {
  try {
    const data = await api(`/tickets/${ticketId}/related`);
    if (!data.relatedAppointment) return;

    const sec = document.getElementById('relatedSection');
    sec.classList.remove('hidden');

    const a = data.relatedAppointment;
    document.getElementById('relatedContent').innerHTML = `
      <dl class="related-appointment">
        <dt>Fecha de la cita</dt><dd>${fmtDate(a.scheduledDate)}</dd>
        <dt>Estado</dt>          <dd>${statusChip(a.status)}</dd>
        <dt>Tipo de sangre</dt>  <dd>${a.bloodType || '—'}</dd>
        <dt>Campaña</dt>         <dd>${a.campaignId?.title || 'Sin campaña'}</dd>
        <dt>Paciente</dt>        <dd>${a.userId?.name || '—'} (${a.userId?.email || '—'})</dd>
        <dt>Notas</dt>           <dd>${a.notes || '—'}</dd>
      </dl>
    `;
    document.getElementById('relatedMeta').textContent =
      `Fuente ticket: ${data.meta.ticketSource} | Fuente cita: ${data.meta.appointmentSource} | ${data.meta.generatedAt}`;
  } catch (_) {
    // Si falla el híbrido no bloqueamos la vista
  }
}

// ══════════════════════════════════════════════════════════════
// CAMBIO DE ESTADO
// ══════════════════════════════════════════════════════════════
function setupStatusChange() {
  document.getElementById('btnChangeStatus')?.addEventListener('click', async () => {
    const status = document.getElementById('statusSelect').value;
    try {
      await api(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body:   JSON.stringify({ status })
      });
      await loadTicket();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  document.getElementById('btnDeleteTicket')?.addEventListener('click', async () => {
    if (!confirm('¿Eliminar este ticket? Esta acción no se puede deshacer.')) return;
    try {
      await api(`/tickets/${ticketId}`, { method: 'DELETE' });
      window.location.href = '/dashboard.html';
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

// ══════════════════════════════════════════════════════════════
// MENSAJES
// ══════════════════════════════════════════════════════════════
function renderMessages(messages) {
  const el = document.getElementById('messagesList');
  if (!messages.length) {
    el.innerHTML = '<p class="empty-state" style="font-size:.85rem">Sin mensajes aún.</p>';
    return;
  }
  el.innerHTML = '';
  messages.forEach(m => {
    const isMine = m.sender?._id === currentUser.id || m.sender === currentUser.id;
    const div = document.createElement('div');
    div.className = `message-item ${isMine ? 'mine' : 'theirs'}`;
    div.innerHTML = `
      <div class="message-sender">${m.sender?.name || 'Usuario'}</div>
      <div>${m.content}</div>
      <div class="message-time">${fmtDate(m.timestamp)}</div>
    `;
    el.appendChild(div);
  });
  el.scrollTop = el.scrollHeight;
}

function setupMessageForm() {
  document.getElementById('formMessage').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('msgInput');
    const content = input.value.trim();
    if (!content) return;

    try {
      await api(`/tickets/${ticketId}/messages`, {
        method: 'POST',
        body:   JSON.stringify({ content })
      });
      input.value = '';
      await loadTicket();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

// ══════════════════════════════════════════════════════════════
// HISTORIAL
// ══════════════════════════════════════════════════════════════
function renderHistory(history) {
  const el = document.getElementById('historyList');
  if (!history.length) {
    el.innerHTML = '<p class="empty-state" style="font-size:.85rem">Sin cambios registrados.</p>';
    return;
  }
  el.innerHTML = '';
  history.forEach(h => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-dot"></div>
      <div>
        <strong>${h.changedBy?.name || 'Sistema'}</strong> cambió
        <strong>${h.field}</strong>
        ${h.oldValue ? `de <em>${h.oldValue}</em>` : ''}
        a <em>${h.newValue}</em>
        &nbsp;—&nbsp; ${fmtDate(h.timestamp)}
      </div>
    `;
    el.appendChild(div);
  });
}
