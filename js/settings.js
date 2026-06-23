document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadSettings();
});

function goBack() {
  window.location.href = '../index.html';
}

function loadSettings() {
  const notifToggle = document.getElementById('notifToggle');
  if (notifToggle) {
    const saved = localStorage.getItem('seven_notifications');
    notifToggle.checked = saved !== 'false';
  }
}

function toggleNotifications(enabled) {
  if (enabled) {
    setupNotifications();
    localStorage.setItem('seven_notifications', 'true');
    showToast('Notifications enabled', 'success');
  } else {
    localStorage.setItem('seven_notifications', 'false');
    if (currentUserId) {
      database.ref(`users/${currentUserId}/fcmToken`).remove();
    }
    showToast('Notifications disabled', 'info');
  }
}

function clearAllData() {
  if (confirm('This will clear all local data. Are you sure?')) {
    localStorage.clear();
    showToast('Data cleared', 'info');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 500);
  }
}
