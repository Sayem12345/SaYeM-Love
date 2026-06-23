document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
});

async function initializeApp() {
  const isLoggedIn = checkAuth();

  if (isLoggedIn) {
    await initializeAuthenticatedApp();
  } else {
    initializeUnauthenticatedApp();
  }
}

async function initializeAuthenticatedApp() {
  try {
    await database.ref(`users/${currentUserId}/online`).set(true);
    await database.ref(`users/${currentUserId}/lastSeen`).set(Date.now());

    const userData = await getUserData(currentUserId);
    if (userData) {
      currentUser = { ...currentUser, fullName: userData.fullName, avatar: userData.avatar };
    }

    const notifEnabled = localStorage.getItem('seven_notifications');
    if (notifEnabled !== 'false') {
      setupNotifications();
    }

    showMainApp();
  } catch (error) {
    handleLogout();
  }
}

function initializeUnauthenticatedApp() {
  setTimeout(() => {
    window.location.href = 'pages/login.html';
  }, 1500);
}

function showMainApp() {
  const splash = document.querySelector('.splash-screen');
  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => {
      splash.style.display = 'none';
      window.location.href = 'pages/chat.html';
    }, 500);
  }, 1000);
}

window.addEventListener('beforeunload', () => {
  if (currentUserId) {
    database.ref(`users/${currentUserId}/online`).set(false);
    database.ref(`users/${currentUserId}/lastSeen`).set(Date.now());
  }
});

document.addEventListener('visibilitychange', () => {
  if (currentUserId) {
    if (document.visibilityState === 'visible') {
      database.ref(`users/${currentUserId}/online`).set(true);
    } else {
      database.ref(`users/${currentUserId}/online`).set(false);
      database.ref(`users/${currentUserId}/lastSeen`).set(Date.now());
    }
  }
});
