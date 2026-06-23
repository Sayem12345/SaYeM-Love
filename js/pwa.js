if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'OPEN_CHAT') {
      const { chatId } = event.data;
      if (chatId && window.openConversation) {
        window.location.href = 'index.html';
      }
    }
  });
}

function showUpdateNotification() {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = 'Update available! <button onclick="refreshApp()" style="background:var(--accent-primary);color:#fff;border:none;padding:4px 12px;border-radius:12px;margin-left:8px;cursor:pointer">Refresh</button>';
  toast.className = 'toast show';
}

function refreshApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  let deferredPrompt = e;
  const installToast = document.getElementById('installPrompt') || createInstallPrompt();
  installToast.style.display = 'flex';

  installToast.querySelector('.install-btn').addEventListener('click', async () => {
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      installToast.style.display = 'none';
    }
    deferredPrompt = null;
  });

  installToast.querySelector('.install-close').addEventListener('click', () => {
    installToast.style.display = 'none';
    localStorage.setItem('seven_install_dismissed', Date.now().toString());
  });
});

function createInstallPrompt() {
  const div = document.createElement('div');
  div.id = 'installPrompt';
  div.style.cssText = `
    position: fixed; bottom: 1rem; left: 1rem; right: 1rem;
    background: var(--bg-glass); backdrop-filter: blur(20px);
    border: 1px solid var(--border-color); border-radius: var(--radius-lg);
    padding: 1rem; z-index: 1000; display: none;
    align-items: center; gap: 0.8rem;
  `;
  div.innerHTML = `
    <i class="fas fa-heart" style="font-size:1.5rem;color:var(--accent-primary)"></i>
    <div style="flex:1">
      <strong>Install SEVEN</strong>
      <p style="font-size:0.8rem;color:var(--text-secondary)">Add to your home screen</p>
    </div>
    <button class="install-btn" style="background:var(--accent-gradient);color:#fff;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-weight:600">Install</button>
    <button class="install-close" style="background:transparent;color:var(--text-muted);border:none;font-size:1.2rem;cursor:pointer">&times;</button>
  `;
  document.body.appendChild(div);
  return div;
}

window.addEventListener('appinstalled', () => {
  const installToast = document.getElementById('installPrompt');
  if (installToast) installToast.style.display = 'none';
  showToast('App installed!', 'success');
});
