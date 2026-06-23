importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey:"AIzaSyCYU1qtjYgXJ85V8VY3fMEkVm_XEM0ta6E",
  authDomain:"sayem-love-chats.firebaseapp.com",
  databaseURL:"https://sayem-love-chats-default-rtdb.firebaseio.com",
  projectId:"sayem-love-chats",
  storageBucket:"sayem-love-chats.firebasestorage.app",
  messagingSenderId:"251139894835",
  appId:"1:251139894835:web:a9034180eaa78ef36afd46"
});

const m=firebase.messaging();

m.onBackgroundMessage(p=>{
  try{
    const n=p.notification||{};
    const d=p.data||{};
    const title=n.title||d.title||'SEVEN';
    const body=n.body||d.body||'New message';
    const chatId=d.chatId||'';
    const image=n.image||d.image||'';
    const icon=getIcon();
    const opts={
      body:body,
      tag:chatId||'seven-msg',
      icon:icon,
      badge:icon,
      image:image||undefined,
      vibrate:[200,100,200],
      requireInteraction:true,
      silent:false,
      renotify:true,
      timestamp:Date.now(),
      data:{chatId:chatId,timestamp:Date.now()}
    };
    // Play sound via AudioContext
    try{
      const ctx=new(self.AudioContext||self.webkitAudioContext);
      if(ctx){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=800;g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.3)}
    }catch(e){}
    if(title)self.registration.showNotification(title,opts);
  }catch(e){}
});

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  const chatId=e.notification.data&&e.notification.data.chatId;
  const url=chatId?'/chat.html?id='+chatId:'/home.html';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(clist=>{
      for(let c of clist){
        if(c.url.includes(url.split('?')[0])&&'focus'in c)return c.focus().then(()=>{if(chatId)c.navigate(url)});
      }
      if(clients.openWindow)return clients.openWindow(url);
    })
  );
});

function getIcon(){
  return'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="100" fill="%2300A884"/%3E%3Ctext x="256" y="340" font-size="340" font-weight="900" text-anchor="middle" fill="%23FFFFFF" font-family="sans-serif"%3ES%3C/text%3E%3C/svg%3E';
}
