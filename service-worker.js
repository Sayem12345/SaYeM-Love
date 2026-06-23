const C='seven-v4';
const F=['/','index.html','login.html','registration.html','home.html','chat.html','settings.html','profile.html','css/style.css','css/dark.css','css/mobile.css','js/firebase.js','js/app.js','js/auth.js','js/chat.js','js/search.js','js/notifications.js','js/profile.js','manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>k!==C?caches.delete(k):0))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname.includes('gstatic.com')||u.hostname.includes('firebase')||u.hostname.includes('googleapis')||u.hostname.includes('fontawesome')||u.hostname.includes('cdnjs')||u.hostname.includes('bootstrap')){e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));return}
  if(u.hostname.includes('githubusercontent')||u.hostname.includes('github')){e.respondWith(fetch(e.request));return}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const r2=res.clone();caches.open(C).then(c=>c.put(e.request,r2));return res})).catch(()=>caches.match('/index.html')));
});

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push',function(e){
  if(!self.Notification||self.Notification.permission!=='granted')return;
  try{
    let payload={};
    if(e.data){
      try{payload=e.data.json()}catch(ex){payload={title:e.data.text()}}
    }
    const notification=payload.notification||{};
    const data=payload.data||{};
    const title=notification.title||data.title||'SEVEN';
    const body=notification.body||data.body||'New message';
    const image=notification.image||data.image||'';
    const icon=notification.icon||data.icon||'';
    const badge=notification.badge||data.badge||'';
    const tag=notification.tag||data.tag||data.chatId||'seven-msg';
    const chatId=data.chatId||notification.click_action||'';
    const timestamp=notification.timestamp||data.timestamp||Date.now();
    
    const options={
      body:body,
      tag:tag,
      timestamp:timestamp,
      vibrate:[200,100,200],
      requireInteraction:true,
      silent:false,
      renotify:true,
      data:{chatId:chatId,timestamp:timestamp}
    };
    if(image)options.image=image;
    if(icon)options.icon=icon;else options.icon=getIcon();
    if(badge)options.badge=badge;else options.badge=getIcon();
    
    // Play notification sound via AudioContext (workaround for SW)
    e.waitUntil(
      Promise.all([
        self.registration.showNotification(title,options),
        playSoundInSW()
      ])
    );
  }catch(ex){}
});

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  const chatId=e.notification.data&&e.notification.data.chatId;
  const url=chatId?'/chat.html?id='+chatId:'/home.html';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(clientList=>{
      for(let c of clientList){
        if(c.url.includes(url.split('?')[0])&&'focus'in c)return c.focus().then(()=>{if(chatId)c.navigate(url)});
      }
      if(clients.openWindow)return clients.openWindow(url);
    })
  );
});

// ===== HELPER =====
function getIcon(){
  return'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="100" fill="%2300A884"/%3E%3Ctext x="256" y="340" font-size="340" font-weight="900" text-anchor="middle" fill="%23FFFFFF" font-family="sans-serif"%3ES%3C/text%3E%3C/svg%3E';
}

function playSoundInSW(){
  try{
    const ctx=new(self.AudioContext||self.webkitAudioContext);
    if(!ctx)return;
    const osc=ctx.createOscillator();
    const g=ctx.createGain();
    osc.type='sine';osc.frequency.value=800;
    g.gain.setValueAtTime(0.3,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);
    osc.connect(g);g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime+0.3);
  }catch(e){}
}

// Periodic sync for service worker updates
self.addEventListener('periodicsync',e=>{if(e.tag==='update-check')caches.open(C).then(c=>F.forEach(f=>fetch(f).then(r=>{if(r.ok)c.put(f,r)})))});
