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

      if (!res.ok) {
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
