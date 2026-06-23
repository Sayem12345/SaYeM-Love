# Notification Enhancement Plan

## Changes to implement

### 1. Fix notification icon color (both SW files)
**Files:** `firebase-messaging-sw.js`, `service-worker.js`
**Change:** Replace `fill="%2300A884"` (WhatsApp green) with `fill="%237C3AED"` (SEVEN purple) in both `getIcon()` functions.

### 2. Remove duplicate `saveFcmToken` from auth.js
**File:** `js/auth.js`
**Change:** Delete lines 113-120 (the `saveFcmToken` function). Keep the version in `notifications.js`.

### 3. Add FCM token cleanup on logout
**File:** `js/auth.js` + `settings.html`
**Change:** Delete FCM token via `firebase.messaging().deleteToken()` and clear `fcmToken:''` in Firebase before logout.

### 4. Load notifications.js in settings.html
**File:** `settings.html`
**Change:** Add `<script src="js/notifications.js"></script>` after `js/auth.js`.

### 5. Notification permission status indicator in Settings
**File:** `settings.html`
**Change:** Show granted/denied/not-requested state next to Notification toggle.

### 6. Vibration pattern toggle in Settings
**File:** `settings.html` + `js/notifications.js`
**Change:** Add Vibration toggle, respect localStorage in notification handler.

### 7. Enhance in-app notification UX
**File:** `js/notifications.js`
**Change:** Swipe-to-dismiss, fade-out, 5s duration, count badge.

### 8. Notification channel for Android PWA
**File:** `js/notifications.js`
**Change:** Add `android_channel_id: 'seven-messages'` to notification payload.

### 9. Graceful denied permission handling
**File:** `js/notifications.js`
**Change:** Check `Notification.permission === 'denied'` and show toast with guidance.
