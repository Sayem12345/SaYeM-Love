function checkAuth() {
  const userId = localStorage.getItem('seven_user_id');
  const username = localStorage.getItem('seven_username');
  if (userId && username) {
    currentUserId = userId;
    currentUser = { username };
    return true;
  }
  return false;
}

function requireAuth() {
  if (!checkAuth()) {
    window.location.href = 'pages/login.html';
    return false;
  }
  return true;
}

function handleLogout() {
  if (currentUserId) {
    database.ref(`users/${currentUserId}/online`).set(false);
    database.ref(`users/${currentUserId}/lastSeen`).set(Date.now());
    database.ref(`users/${currentUserId}/fcmToken`).remove();
  }
  localStorage.removeItem('seven_user_id');
  localStorage.removeItem('seven_username');
  localStorage.removeItem('seven_name');
  currentUserId = null;
  currentUser = null;
  clearAllListeners();
  window.location.href = 'pages/login.html';
}

function registerUser(fullName, username, password) {
  return new Promise((resolve, reject) => {
    const usersRef = database.ref('users');
    usersRef.orderByChild('username').equalTo(username.toLowerCase()).once('value', (snapshot) => {
      if (snapshot.exists()) {
        reject('Username already taken');
        return;
      }
      const newUserRef = usersRef.push();
      const userId = newUserRef.key;
      const userData = {
        id: userId,
        fullName: fullName,
        username: username.toLowerCase(),
        password: btoa(password),
        avatar: '',
        online: false,
        lastSeen: Date.now(),
        createdAt: Date.now(),
        fcmToken: ''
      };
      newUserRef.set(userData)
        .then(() => {
          localStorage.setItem('seven_user_id', userId);
          localStorage.setItem('seven_username', username.toLowerCase());
          localStorage.setItem('seven_name', fullName);
          currentUserId = userId;
          currentUser = { username: username.toLowerCase(), fullName, id: userId };
          resolve(userData);
        })
        .catch(reject);
    });
  });
}

function loginUser(username, password) {
  return new Promise((resolve, reject) => {
    database.ref('users').orderByChild('username').equalTo(username.toLowerCase()).once('value', (snapshot) => {
      if (!snapshot.exists()) {
        reject('User not found');
        return;
      }
      let userData = null;
      let userId = null;
      snapshot.forEach((child) => {
        userData = child.val();
        userId = child.key;
      });
      if (atob(userData.password) !== password) {
        reject('Incorrect password');
        return;
      }
      localStorage.setItem('seven_user_id', userId);
      localStorage.setItem('seven_username', username.toLowerCase());
      localStorage.setItem('seven_name', userData.fullName);
      currentUserId = userId;
      currentUser = { username: username.toLowerCase(), fullName: userData.fullName, id: userId };
      database.ref(`users/${userId}/online`).set(true);
      database.ref(`users/${userId}/lastSeen`).set(Date.now());
      resolve(userData);
    });
  });
}

function getUserData(userId) {
  return database.ref(`users/${userId}`).once('value').then(s => s.val());
}

function updateUserProfile(userId, updates) {
  return database.ref(`users/${userId}`).update(updates);
}

function changePassword(userId, newPassword) {
  return database.ref(`users/${userId}/password`).set(btoa(newPassword));
}

function checkUsernameAvailability(username) {
  return database.ref('users').orderByChild('username').equalTo(username.toLowerCase()).once('value')
    .then(s => !s.exists());
}
