document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.hidden = true;

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (res.ok) {
    window.location.href = '/dashboard.html';
  } else {
    errorEl.textContent = 'Invalid username or password';
    errorEl.hidden = false;
  }
});

fetch('/api/session').then(r => r.json()).then(data => {
  if (data.authenticated) window.location.href = '/dashboard.html';
});
