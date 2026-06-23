document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadProfile();
});

function goBack() {
  window.location.href = '../index.html';
}

function navigateSettings() {
  window.location.href = 'settings.html';
}

async function loadProfile() {
  try {
    const data = await getUserData(currentUserId);
    if (!data) {
      showToast('Failed to load profile', 'error');
      return;
    }
    document.getElementById('profileAvatar').src = data.avatar || '../assets/images/default-avatar.png';
    document.getElementById('profileName').value = data.fullName || '';
    document.getElementById('profileUsername').value = data.username || '';
    document.getElementById('profilePassword').value = '';
    document.getElementById('profileConfirmPassword').value = '';
  } catch (error) {
    showToast('Failed to load profile', 'error');
  }
}

function enableEdit(inputId) {
  const input = document.getElementById(inputId);
  if (inputId === 'profileUsername') {
    input.readOnly = false;
    input.focus();
    input.addEventListener('input', debounce(checkProfileUsername, 500));
  } else if (inputId === 'profilePassword') {
    input.focus();
  } else {
    input.readOnly = false;
    input.focus();
  }
}

async function checkProfileUsername() {
  const username = document.getElementById('profileUsername').value.trim();
  const status = document.getElementById('profileUsernameStatus');
  if (!username) {
    status.textContent = '';
    status.className = 'field-status';
    return;
  }
  if (username === localStorage.getItem('seven_username')) {
    status.textContent = 'Current username';
    status.className = 'field-status';
    return;
  }
  const available = await checkUsernameAvailability(username);
  status.textContent = available ? 'Available' : 'Taken';
  status.className = `field-status ${available ? 'available' : 'taken'}`;
}

async function saveProfile() {
  const name = document.getElementById('profileName').value.trim();
  const username = document.getElementById('profileUsername').value.trim();
  const password = document.getElementById('profilePassword').value;
  const confirmPassword = document.getElementById('profileConfirmPassword').value;
  const usernameStatus = document.getElementById('profileUsernameStatus');

  if (!name) {
    showToast('Name cannot be empty', 'error');
    return;
  }

  const updates = {};

  if (name) updates.fullName = name;
  if (username && username !== localStorage.getItem('seven_username')) {
    if (usernameStatus.classList.contains('taken')) {
      showToast('Username is already taken', 'error');
      return;
    }
    if (username.length < 3) {
      showToast('Username must be at least 3 characters', 'error');
      return;
    }
    updates.username = username.toLowerCase();
  }

  try {
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
      await changePassword(currentUserId, password);
    }

    if (Object.keys(updates).length > 0) {
      await updateUserProfile(currentUserId, updates);
    }

    if (updates.fullName) localStorage.setItem('seven_name', updates.fullName);
    if (updates.username) localStorage.setItem('seven_username', updates.username);

    showToast('Profile updated!', 'success');
    loadProfile();
  } catch (error) {
    showToast('Failed to update profile', 'error');
  }
}

async function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }

  try {
    showToast('Uploading...', 'info');
    const url = await uploadProfileImage(file);
    document.getElementById('profileAvatar').src = url;
    showToast('Avatar updated!', 'success');
  } catch (error) {
    showToast('Failed to upload avatar', 'error');
  }
}
