/* ============================================================
   auth.js — lógica de la página de login
   ============================================================ */

(function () {
  // Si ya hay sesión activa, ir al dashboard
  if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form    = document.getElementById('loginForm');
  const errDiv  = document.getElementById('error-msg');
  const loginBtn = document.getElementById('loginBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errDiv.classList.add('hidden');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Verificando…';

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });

      const data = await res.json();
      const ok = res.ok;

      console.groupCollapsed(
        '%c POST %c /api/auth/login %c ' + res.status,
        'background:#22c55e;color:#fff;font-weight:bold;padding:2px 8px;border-radius:4px;font-family:monospace',
        'color:#22c55e;font-weight:bold;font-family:monospace',
        `background:${ok ? '#22c55e' : '#ef4444'};color:#fff;font-size:11px;padding:1px 6px;border-radius:10px;font-family:monospace`
      );
      console.log('%c body    ', 'color:#94a3b8;font-weight:bold;font-family:monospace', { email, password: '***' });
      if (ok)
        console.log('%c response', 'color:#94a3b8;font-weight:bold;font-family:monospace', { ...data, token: data.token ? '[JWT]' : undefined });
      else
        console.log('%c error   ', 'color:#ef4444;font-weight:bold;font-family:monospace', data.message);
      console.groupEnd();

      if (!ok) {
        showError(data.message || 'Error al iniciar sesión');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      window.location.href = '/dashboard.html';

    } catch (err) {
      showError('No se pudo conectar con el servidor');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar sesión';
    }
  });

  function showError(msg) {
    errDiv.textContent = msg;
    errDiv.classList.remove('hidden');
  }
})();
