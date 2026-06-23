# SEVEN - Real-Time Chat Application

Modern Messenger-style real-time chat app with Firebase backend, GitHub image storage, and PWA support.

## Features

- **Text & Image Messages** — send, edit, reply, copy, delete
- **Real-time** — instant delivery, typing indicator, online status
- **Image Upload** — GitHub API with progress bar
- **Image Viewer** — fullscreen preview, pinch zoom, download with progress
- **Search** — users, chats, and messages
- **Notifications** — Firebase Cloud Messaging (foreground + background)
- **PWA** — installable, offline cache, splash screen
- **Dark UI** — Messenger-style professional dark theme
- **Responsive** — mobile-first, desktop support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Framework | Bootstrap 5 |
| Icons | Font Awesome 6 |
| Fonts | Inter, Poppins |
| Database | Firebase Realtime Database |
| Auth | Firebase Authentication |
| Push | Firebase Cloud Messaging |
| Images | GitHub Repository API |
| PWA | Service Worker + Manifest |

## Project Structure

```
/
├── index.html              # Splash / entry
├── login.html              # Login page
├── registration.html       # Registration with profile pic
├── home.html               # Main app (chats, active, search, profile, settings)
├── chat.html               # Chat interface
├── profile.html            # Profile view/edit
├── settings.html           # Settings page
├── manifest.json           # PWA manifest
├── service-worker.js       # PWA service worker
├── firebase-messaging-sw.js# FCM service worker
├── css/
│   ├── style.css           # Main styles
│   ├── dark.css            # Dark theme overrides
│   └── mobile.css          # Mobile responsive
├── js/
│   ├── firebase.js         # Firebase config + init
│   ├── app.js              # Core utilities (formatTime, uid, toast, ghUpload)
│   ├── auth.js             # Auth (login, register, logout, password change)
│   ├── chat.js             # Chat logic (send, receive, listen, typing)
│   ├── search.js           # Search (users, chats, messages)
│   ├── notifications.js    # FCM setup + handlers
│   └── profile.js          # Profile loading
```

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or use existing)
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Enable **Realtime Database** → create in **us-central1** → start in **locked mode** → update rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

5. Enable **Cloud Messaging** (no setup needed)
6. Register a **Web App** → copy the config object

### 2. Configure Firebase

Edit `js/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. GitHub Token

The app stores images in a GitHub repository. You need:

1. A GitHub repository (public or private)
2. A [Personal Access Token](https://github.com/settings/tokens) with `repo` scope
3. In the app: **Settings → GitHub Token** → paste your token

The token is stored in `localStorage` and used for all image uploads.

### 4. VAPID Key (for Push Notifications)

Generate a VAPID key pair:
- Visit [web-push-codelab.glitch.me](https://web-push-codelab.glitch.me/)
- Or use the Firebase Console → Cloud Messaging → Web configuration → Generate key pair

Set the public key in `js/firebase.js`:

```js
const FCM_VAPID = 'YOUR_PUBLIC_VAPID_KEY';
```

## Deployment

### GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from branch** → `main` → `/ (root)`
4. Save — your app is live at `https://<user>.github.io/<repo>/`

### Netlify

1. Push to GitHub
2. Go to [Netlify](https://app.netlify.com/) → **Add new site → Import from Git**
3. Select repo → build command: **none** → publish directory: `/`
4. Deploy — auto-deploys on every push

### Vercel

1. Push to GitHub
2. Go to [Vercel](https://vercel.com/) → **Import Git Repository**
3. Framework preset: **Other** → Root directory: `./`
4. Deploy

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to ./
# Configure as single-page app: yes
firebase deploy
```

### Cloudflare Pages

1. Push to GitHub
2. Cloudflare Dashboard → **Pages** → **Create a project** → **Connect to Git**
3. Build settings: **Framework preset: None** → Build command: *leave empty* → Build output: `/`
4. Deploy

### cPanel

1. Zip all files (excluding `.git`)
2. Upload via cPanel **File Manager** → extract in `public_html/`
3. Or use FTP to upload files

## Firebase Database Structure

```
users/
  {userId}/
    name: "User Name"
    password: "hash"
    profileImage: "url"      (optional, from GitHub)
    onlineStatus: true
    lastSeen: 1234567890
    createdAt: 1234567890
    fcmToken: "token"        (optional, for push)

chats/
  {userA_userB}/
    participants: { userA: true, userB: true }
    lastMessage: "Hello"
    lastSender: "userA"
    lastTime: 1234567890

messages/
  {chatId}/
    {messageId}/
      senderId: "userA"
      type: "text" | "image"
      text: "Hello"
      imageUrl: "..."        (if type === "image")
      timestamp: 1234567890
      delivered: true
      seen: false

presence/
  {userId}/
    online: true
    lastSeen: 1234567890

notifications/
  {userId}/
    {notifId}/
      title: "Sender Name"
      body: "Message preview"
      chatId: "chatId"
      timestamp: 1234567890
```

## Message Status

| Icon | Meaning |
|------|---------|
| ✓ | Sent |
| ✓✓ | Delivered |
| ✓✓ (blue) | Seen |

## License

MIT
