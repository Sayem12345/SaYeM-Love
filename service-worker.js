const CACHE='seven-v1';
const FILES=['/','index.html','login.html','registration.html','home.html','chat.html','profile.html','settings.html','css/style.css','css/dark.css','css/mobile.css','js/firebase.js','js/app.js','js/auth.js','js/chat.js','js/search.js','js/notifications.js','js/profile.js','manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):Promise.resolve()))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.hostname==='www.gstatic.com'||url.hostname==='firebase.googleapis.com'){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  if(url.pathname.startsWith('/uploads/')||url.pathname.startsWith('/css/')||url.pathname.startsWith('/js/')||url.pathname.endsWith('.html')||url.pathname==='/'||url.pathname==='/manifest.json'){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const r2=res.clone();caches.open(CACHE).then(c=>c.put(e.request,r2));return res})).catch(()=>caches.match('/index.html')));
  }
});

// FCM background notification handler
self.addEventListener('push',function(e){
  if(!(self.Notification&&self.Notification.permission==='granted'))return;
  let data={};
  try{data=e.data?e.data.json():{};if(data.notification)data=data.notification}catch(ex){}
  const title=data.title||'SEVEN';
  const body=data.body||'New message';
  const icon=data.icon||'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 512 512%22%3E%3Crect width=%22512%22 height=%22512%22 rx=%22100%22 fill=%22%230F172A%22/%3E%3Ctext x=%22256%22 y=%22320%22 font-size=%22320%22 font-weight=%22900%22 text-anchor=%22middle%22 fill=%22%233B82F6%22 font-family=%22sans-serif%22%3ES%3C/text%3E%3C/svg%3E';
  const chatId=data.chatId||data.click_action||'';
  e.waitUntil(self.registration.showNotification(title,{body,icon,data:{chatId},vibrate:[200,100,200],sound:'default',requireInteraction:true}));
});

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  const chatId=e.notification.data&&e.notification.data.chatId;
  const url=chatId?'/chat.html?id='+chatId:'/home.html';
  e.waitUntil(clients.openWindow(url));
});
