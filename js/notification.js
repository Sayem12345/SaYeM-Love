let notifEnabled = localStorage.getItem('snotif')!=='false';

async function setupNotifications(){
  if(!messaging){console.log('Messaging N/A');return}
  try{
    const p=await Notification.requestPermission();
    if(p!=='granted'){notifEnabled=false;localStorage.setItem('snotif','false');return}
    notifEnabled=true;localStorage.setItem('snotif','true');
    const token=await messaging.getToken({vapidKey:VAPID_KEY});
    if(currentUserId)await database.ref('users/'+currentUserId+'/fcmToken').set(token);
    messaging.onMessage(payload=>{
      if(!payload||!payload.notification)return;
      const {title,body}=payload.notification;
      const data=payload.data||{};
      if(data.senderId&&data.senderId!==currentUserId)toast(title+': '+body);
    });
  }catch(e){notifEnabled=false}
}

async function sendPush(targetId,title,body,data={}){
  try{
    const u=await getUser(targetId);
    if(!u||!u.fcmToken)return;
    await fetch('https://fcm.googleapis.com/fcm/send',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'key='+firebaseConfig.apiKey},
      body:JSON.stringify({to:u.fcmToken,notification:{title,body},data:{senderId:currentUserId,...data}})
    });
  }catch(e){}
}

document.addEventListener('DOMContentLoaded',()=>{
  if(notifEnabled)setupNotifications();
});
