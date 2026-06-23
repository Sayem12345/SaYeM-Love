document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
});

async function initializeApp() {
  const isLoggedIn = checkAuth();

  if (isLoggedIn) {
    await initializeAuthenticatedApp();
  } else {
    await initializeUnauthenticatedApp();
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

async function initializeUnauthenticatedApp() {
  showSplash();
  setTimeout(() => {
    window.location.href = 'pages/login.html';
  }, 2000);
}

function showMainApp() {
  const splash = document.querySelector('.splash-screen');
  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => {
      splash.style.display = 'none';
      initializeChatUI();
    }, 500);
  }, 1000);
}

function initializeChatUI() {
  if (document.getElementById('chatListView')) {
    loadChatList();
  } else {
    window.location.href = 'index.html';
  }
}

function showSplash() {
  const splash = document.querySelector('.splash-screen');
  if (splash) {
    splash.style.display = 'flex';
    splash.classList.remove('hide');
  }
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
