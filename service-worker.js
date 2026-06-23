const C='seven-v2';
const F=['/','index.html','login.html','registration.html','home.html','chat.html','profile.html','settings.html','css/style.css','css/dark.css','css/mobile.css','js/firebase.js','js/app.js','js/auth.js','js/chat.js','js/search.js','js/notifications.js','js/profile.js','manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>k!==C?caches.delete(k):0))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname.includes('gstatic.com')||u.hostname.includes('firebase')){e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));return}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const r2=res.clone();caches.open(C).then(c=>c.put(e.request,r2));return res})).catch(()=>caches.match('/index.html')));
});
self.addEventListener('push',function(e){
  if(!self.Notification||self.Notification.permission!=='granted')return;
  let d={};try{d=e.data?e.data.json():{};if(d.notification)d=d.notification}catch(ex){}
  const t=d.title||'SEVEN',b=d.body||'New message',c=d.chatId||d.click_action||'';
  e.waitUntil(self.registration.showNotification(t,{body:b,data:{chatId:c},vibrate:[200,100,200],requireInteraction:true}));
});
self.addEventListener('notificationclick',function(e){e.notification.close();const id=e.notification.data&&e.notification.data.chatId;e.waitUntil(clients.openWindow(id?'/chat.html?id='+id:'/home.html'))});