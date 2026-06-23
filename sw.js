const CACHE = 'seven-v2';
const URLS = [
  '/','/index.html','/offline.html','/manifest.json',
  '/pages/login.html','/pages/register.html','/pages/chat.html','/pages/profile.html',
  '/css/main.css','/css/auth.css','/css/chat.css','/css/profile.css',
  '/js/firebase-config.js','/js/utils.js','/js/auth.js','/js/login.js','/js/register.js',
  '/js/chat.js','/js/search.js','/js/profile.js','/js/notification.js','/js/pwa.js','/js/app.js',
  '/assets/images/default-avatar.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics-compat.js'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>k!==CACHE?caches.delete(k):''))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.hostname.includes('firebaseio')||u.hostname.includes('googleapis')||u.hostname.includes('raw.githubusercontent'))return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
    if(r&&r.status===200&&r.type==='basic'){const k=r.clone();caches.open(CACHE).then(c=>c.put(e.request,k))}
    return r;
  }).catch(()=>e.request.mode==='navigate'?caches.match('/offline.html'):new Response('Offline',{status:503}))));
});

self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('push',e=>{
  if(!e.data)return;
  try{
    const d=e.data.json();
    e.waitUntil(self.registration.showNotification(d.notification?.title||'SEVEN',{
      body:d.notification?.body||'New message',
      icon:'/assets/icons/icon-192.svg',
      badge:'/assets/icons/icon-96.svg',
      vibrate:[200,100,200],
      data:{chatId:d.data?.chatId||'',senderId:d.data?.senderId||'',url:'/'},
      actions:[{action:'open',title:'Open'}]
    }));
  }catch(e1){}
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=e.notification.data?.url||'/';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(ls=>{
    for(const c of ls){if(c.url.includes('/pages/')&&'focus'in c){c.postMessage({type:'OPEN_CHAT',chatId:e.notification.data?.chatId||''});return c.focus()}}
    return clients.openWindow(url);
  }));
});
