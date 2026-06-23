let notificationEnabled = false;
let currentFcmToken = '';

async function setupNotifications() {
  if (!messaging) {
    console.log('Messaging not supported');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      notificationEnabled = false;
      localStorage.setItem('seven_notifications', 'false');
      return;
    }

    notificationEnabled = true;
    localStorage.setItem('seven_notifications', 'true');

    const token = await messaging.getToken({ vapidKey: VAPID_KEY });
    currentFcmToken = token;

    if (currentUserId) {
      await database.ref(`users/${currentUserId}/fcmToken`).set(token);
    }

    messaging.onMessage((payload) => {
      handleForegroundNotification(payload);
    });

  } catch (error) {
    console.log('Notification setup error:', error);
    notificationEnabled = false;
  }
}

function handleForegroundNotification(payload) {
  if (!payload || !payload.notification) return;

  const { title, body } = payload.notification;
  const data = payload.data || {};

  if (data.senderId && data.senderId !== currentUserId) {
    showToast(`${title}: ${body}`, 'info');
    playNotificationSound();
  }
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

async function toggleNotifications(enabled) {
  if (enabled) {
    await setupNotifications();
  } else {
    notificationEnabled = false;
    localStorage.setItem('seven_notifications', 'false');
    if (currentUserId && currentFcmToken) {
      await database.ref(`users/${currentUserId}/fcmToken`).remove();
    }
  }
}

async function sendPushNotification(targetUserId, title, body, data = {}) {
  try {
    const userData = await getUserData(targetUserId);
    if (!userData || !userData.fcmToken) return;

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${firebaseConfig.apiKey}`
      },
      body: JSON.stringify({
        to: userData.fcmToken,
        notification: { title, body },
        data: {
          senderId: currentUserId,
          ...data
        }
      })
    });
  } catch (error) {
    console.log('Push notification error:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('seven_notifications');
  if (saved === 'true' || saved === null) {
    notificationEnabled = true;
  } else {
    notificationEnabled = false;
  }
});
