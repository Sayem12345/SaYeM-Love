// Firebase messaging service worker
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

const messaging=firebase.messaging();

messaging.onBackgroundMessage(payload=>{
  const{title,body}=payload.notification||{};
  const chatId=payload.data?.chatId||'';
  if(title){
    self.registration.showNotification(title,{
      body:body||'New message',
      icon:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 512 512%22%3E%3Crect width=%22512%22 height=%22512%22 rx=%22100%22 fill=%22%230F172A%22/%3E%3Ctext x=%22256%22 y=%22320%22 font-size=%22320%22 font-weight=%22900%22 text-anchor=%22middle%22 fill=%22%233B82F6%22 font-family=%22sans-serif%22%3ES%3C/text%3E%3C/svg%3E',
      data:{chatId},
      vibrate:[200,100,200],
      sound:'default',
      requireInteraction:true
    });
  }
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const chatId=e.notification.data&&e.notification.data.chatId;
  const url=chatId?'/chat.html?id='+chatId:'/home.html';
  e.waitUntil(clients.openWindow(url));
});
