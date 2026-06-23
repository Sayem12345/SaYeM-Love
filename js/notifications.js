// ===== ADVANCED FCM NOTIFICATIONS =====
let messaging=null;
let fcmTokenRefreshInterval=null;

async function initNotifications(){
  if(!('Notification'in window)||!firebase.messaging)return;
  try{
    messaging=firebase.messaging();
    const perm=await Notification.requestPermission();
    if(perm!=='granted')return;
    await refreshFcmToken();
    messaging.onTokenRefresh(async()=>{await refreshFcmToken()});
    messaging.onMessage(handleForegroundMessage);
    // Periodic token refresh (every 12 hours)
    fcmTokenRefreshInterval=setInterval(refreshFcmToken,43200000);
  }catch(e){console.log('FCM init:',e)}
}

async function refreshFcmToken(){
  try{
    if(!messaging)return;
    const token=await messaging.getToken({vapidKey:FCM_VAPID});
    if(token)await saveFcmToken(token);
    return token;
  }catch(e){return null}
}

async function saveFcmToken(token){
  const uid=localStorage.getItem('uid');
  if(!uid||!token)return;
  try{
    const snap=await REFS.users.child(uid).child('fcmToken').once('value');
    if(snap.val()!==token)await REFS.users.child(uid).update({fcmToken:token});
  }catch(e){}
}

// ===== FOREGROUND MESSAGE =====
function handleForegroundMessage(payload){
  try{
    const n=payload.notification||{};
    const d=payload.data||{};
    const title=n.title||d.title||'SEVEN';
    const body=n.body||d.body||'New message';
    const chatId=d.chatId||'';
    const image=n.image||d.image||'';
    const senderName=d.senderName||title;
    const senderImage=d.senderImage||'';
    const timestamp=d.timestamp||Date.now();

    if(SOUNDS.notification)SOUNDS.notification();
    if(localStorage.getItem('vibrate')!=='off')try{navigator.vibrate([100,50,100])}catch(e){}
    showInAppNotification(senderName,body,senderImage,chatId,image,timestamp);
    // Update unread badge
    updateUnreadBadge();
  }catch(e){}
}

// ===== IN-APP TOAST NOTIFICATION =====
function showInAppNotification(senderName,body,senderImage,chatId,image,timestamp){
  const notif=document.createElement('div');
  notif.className='in-app-notif';
  const ts=timestamp?new Date(timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
  const imgHtml=senderImage?`<img class="avatar avatar-sm" src="${senderImage}" alt="">`:`<div class="avatar avatar-sm avatar-placeholder" style="width:34px;height:34px;font-size:13px">${(senderName||'?')[0]}</div>`;
  const imgContent=image?`<img src="${image}" class="in-app-notif-img" alt="">`:'';
  notif.innerHTML=`
    <div class="in-app-notif-inner">
      ${imgHtml}
      <div class="in-app-notif-content">
        <div class="in-app-notif-name">${escapeHtml(senderName)}</div>
        <div class="in-app-notif-body">${escapeHtml(body)}</div>
        <div class="in-app-notif-time">${ts}</div>
      </div>
      ${imgContent}
    </div>
    <button class="in-app-notif-close" onclick="this.parentElement.remove()">✕</button>
  `;
  if(chatId&&document.querySelector(`[data-chat-id="${chatId}"]`)){
    // Already viewing this chat, don't show notification
    notif.remove();
    return;
  }
  if(chatId)notif.onclick=()=>{notif.remove();goTo('chat.html?id='+chatId+'&partner='+chatId)};
  document.body.appendChild(notif);
  requestAnimationFrame(()=>notif.classList.add('show'));
  setTimeout(()=>{notif.classList.remove('show');setTimeout(()=>notif.remove(),300)},4500);
}

// ===== UPDATES UNREAD BADGE =====
async function updateUnreadBadge(){
  const myId=uid();
  if(!myId)return;
  try{
    const snap=await REFS.chats.once('value');
    let total=0;
    const promises=[];
    snap.forEach(child=>{
      const chat=child.val();
      if(chat.participants&&chat.participants[myId]&&!chat.archived){
        const partnerId=Object.keys(chat.participants).find(p=>p!==myId);
        const p=REFS.messages.child(child.key).orderByChild('senderId').once('value',msgSnap=>{
          msgSnap.forEach(m=>{
            const msg=m.val();
            if(msg.senderId!==myId&&!msg.seen)total++;
          });
        });
        promises.push(p);
      }
    });
    await Promise.all(promises);
    // Update browser badge (PWA)
    if(navigator.setAppBadge)navigator.setAppBadge(total);
    else if(navigator.setExperimentalAppBadge)navigator.setExperimentalAppBadge(total);
    // Update tab title
    document.title=total>0?'SEVEN ('+total+')':'SEVEN';
  }catch(e){}
}

// ===== CLEANUP =====
function cleanupNotifications(){
  if(fcmTokenRefreshInterval)clearInterval(fcmTokenRefreshInterval);
  if(messaging){
    try{messaging.deleteToken().catch(()=>{})}catch(e){}
  }
}

// Add in-app notification CSS dynamically
const notifStyle=document.createElement('style');
notifStyle.textContent=`
.in-app-notif{position:fixed;top:0;left:0;right:0;z-index:9999;transform:translateY(-100%);transition:transform .3s cubic-bezier(.32,.72,0,1);padding:10px 14px;padding-top:calc(env(safe-area-inset-top,0)+10px);display:flex;align-items:flex-start;gap:10px;background:rgba(30,41,59,.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--glass-border);cursor:pointer}
.in-app-notif.show{transform:translateY(0)}
.in-app-notif-inner{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.in-app-notif-content{flex:1;min-width:0}
.in-app-notif-name{font-weight:600;font-size:13px;color:var(--primary)}
.in-app-notif-body{font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.in-app-notif-time{font-size:10px;color:var(--text3);margin-top:2px}
.in-app-notif-img{width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0}
.in-app-notif-close{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:12px;cursor:pointer;flex-shrink:0;background:var(--bg3);border:none;margin-top:2px}
.in-app-notif-close:active{background:var(--danger);color:#fff}
`;
document.head.appendChild(notifStyle);
