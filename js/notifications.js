// ===== FCM NOTIFICATIONS =====
let messaging=null;

async function initNotifications(){
  if(!('Notification'in window))return;
  if(!firebase.messaging)return;

  try{
    messaging=firebase.messaging();

    // Request permission
    const perm=await Notification.requestPermission();
    if(perm!=='granted')return;

    // Get FCM token
    const token=await messaging.getToken({vapidKey:FCM_VAPID});
    if(token){
      await saveFcmToken(token);
    }

    // Foreground messages
    messaging.onMessage(payload=>{
      const{title,body}=payload.notification||{};
      if(title){
        if(SOUNDS.notification)SOUNDS.notification();
        // Show in-app notification
        showInAppNotification(title,body,payload.data?.chatId);
      }
    });

  }catch(e){
    console.log('FCM init error:',e);
  }
}

function showInAppNotification(title,body,chatId){
  const notif=document.createElement('div');
  notif.style.cssText=`
    position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;
    background:var(--bg2,#1E293B);border:1px solid var(--glass-border,rgba(255,255,255,0.08));
    border-radius:12px;padding:12px 16px;max-width:360px;width:90%;
    box-shadow:0 8px 32px rgba(0,0,0,0.3);cursor:pointer;
    animation:slideDown 0.3s ease;backdrop-filter:blur(20px)
  `;
  notif.innerHTML=`
    <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:var(--primary,#3B82F6)">${escapeHtml(title)}</div>
    <div style="font-size:13px;color:var(--text2,#94A3B8)">${escapeHtml(body||'')}</div>
  `;
  if(chatId){
    notif.onclick=()=>{
      notif.remove();
      goTo('chat.html?id='+chatId);
    };
  }
  document.body.appendChild(notif);
  setTimeout(()=>{
    notif.style.opacity='0';
    notif.style.transform='translateX(-50%) translateY(-20px)';
    notif.style.transition='all 0.3s ease';
    setTimeout(()=>notif.remove(),300);
  },4000);
}

// Add keyframe for notification
const style=document.createElement('style');
style.textContent=`
  @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
`;
document.head.appendChild(style);
