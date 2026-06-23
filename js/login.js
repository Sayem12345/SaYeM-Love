document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    window.location.href = '../index.html';
    return;
  }
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

  if (!username || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }

  showLoading(btn);

  try {
    await loginUser(username, password);
    showToast('Welcome back!', 'success');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 500);
  } catch (error) {
    showToast(error, 'error');
    hideLoading(btn);
  }
}
