document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    window.location.href = '../index.html';
    return;
  }
  const usernameInput = document.getElementById('regUsername');
  const passwordInput = document.getElementById('regPassword');
  const confirmInput = document.getElementById('regConfirmPassword');

  usernameInput.addEventListener('input', debounce(checkUsername, 500));
  passwordInput.addEventListener('input', checkPasswordStrength);
  confirmInput.addEventListener('input', checkPasswordMatch);

  document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

async function checkUsername() {
  const username = document.getElementById('regUsername').value.trim();
  const status = document.getElementById('usernameStatus');
  if (!username) {
    status.textContent = '';
    status.className = 'input-status';
    return;
  }
  if (username.length < 3) {
    status.textContent = 'Min 3 characters';
    status.className = 'input-status taken';
    return;
  }
  const available = await checkUsernameAvailability(username);
  status.textContent = available ? 'Available' : 'Taken';
  status.className = `input-status ${available ? 'available' : 'taken'}`;
}

function checkPasswordStrength() {
  const password = document.getElementById('regPassword').value;
  const strength = document.getElementById('passwordStrength');
  if (!password) {
    strength.textContent = '';
    strength.className = 'password-strength';
    return;
  }
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    strength.textContent = 'Weak';
    strength.className = 'password-strength weak';
  } else if (score <= 3) {
    strength.textContent = 'Medium';
    strength.className = 'password-strength medium';
  } else {
    strength.textContent = 'Strong';
    strength.className = 'password-strength strong';
  }
}

function checkPasswordMatch() {
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  const status = document.getElementById('passwordStrength');
  if (!confirm) return;
  if (password !== confirm) {
    status.textContent = 'Passwords do not match';
    status.className = 'password-strength weak';
  } else {
    checkPasswordStrength();
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regFullName').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  const btn = document.getElementById('registerBtn');

  if (!fullName || !username || !password || !confirm) {
    showToast('Please fill all fields', 'error');
    return;
  }
  if (password !== confirm) {
    showToast('Passwords do not match', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }
  if (username.length < 3) {
    showToast('Username must be at least 3 characters', 'error');
    return;
  }

  showLoading(btn);

  try {
    await registerUser(fullName, username, password);
    showToast('Account created!', 'success');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 500);
  } catch (error) {
    showToast(error, 'error');
    hideLoading(btn);
  }
}
