importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
firebase.initializeApp({apiKey:"AIzaSyCYU1qtjYgXJ85V8VY3fMEkVm_XEM0ta6E",authDomain:"sayem-love-chats.firebaseapp.com",databaseURL:"https://sayem-love-chats-default-rtdb.firebaseio.com",projectId:"sayem-love-chats",storageBucket:"sayem-love-chats.firebasestorage.app",messagingSenderId:"251139894835",appId:"1:251139894835:web:a9034180eaa78ef36afd46"});
const m=firebase.messaging();
m.onBackgroundMessage(p=>{const{title,body}=p.notification||{};const id=p.data?.chatId||'';if(title)self.registration.showNotification(title,{body:body||'New message',data:{chatId:id},vibrate:[200,100,200],requireInteraction:true})});
self.addEventListener('notificationclick',function(e){e.notification.close();const id=e.notification.data&&e.notification.data.chatId;e.waitUntil(clients.openWindow(id?'/chat.html?id='+id:'/home.html'))});