// ===== CHAT STATE =====
let currentChatId=null;
let currentPartnerId=null;
let chatListener=null;
let messageListeners={};
let typingListeners={};

// ===== CREATE OR GET CHAT =====
async function getOrCreateChat(partnerId){
  const myId=uid();
  if(!myId)return null;
  const chatId=[myId,partnerId].sort().join('_');
  try{
    const snap=await REFS.chats.child(chatId).once('value');
    if(!snap.exists()){
      await REFS.chats.child(chatId).set({
        participants:{[myId]:true,[partnerId]:true},
        createdAt:Date.now(),
        lastMessage:'',
        lastSender:'',
        lastTime:Date.now()
      });
    }
    return chatId;
  }catch(e){toast('Error creating chat','error');return null}
}

// ===== SEND MESSAGE =====
async function sendMessage(chatId,text,type='text',imageUrl='',replyTo=null){
  const myId=uid();
  if(!myId||!chatId)return;
  const msgId=generateId();
  const msg={
    senderId:myId,
    text,
    type,
    timestamp:Date.now(),
    seen:false,
    delivered:false
  };
  if(imageUrl)msg.imageUrl=imageUrl;
  if(replyTo)msg.replyTo=replyTo;
  try{
    await REFS.messages.child(chatId).child(msgId).set(msg);
    await REFS.chats.child(chatId).update({
      lastMessage:text||'📷 Image',
      lastSender:myId,
      lastTime:Date.now()
    });
    // Send push notification to partner
    const chatSnap=await REFS.chats.child(chatId).once('value');
    const participants=chatSnap.val().participants;
    const partnerId=Object.keys(participants).find(p=>p!==myId);
    if(partnerId){
      const userSnap=await REFS.users.child(partnerId).once('value');
      const partner=userSnap.val();
      if(partner&&partner.fcmToken){
        sendPushNotification(partner.fcmToken,currentUser?.name||'SEVEN User',text||'Sent an image',chatId);
      }
    }
    if(SOUNDS.send)SOUNDS.send();
    return msgId;
  }catch(e){toast('Send failed','error')}
}

// ===== LISTEN TO CHAT MESSAGES =====
function listenMessages(chatId,callback){
  if(messageListeners[chatId])messageListeners[chatId]();
  const ref=REFS.messages.child(chatId).orderByChild('timestamp').limitToLast(100);
  const listener=ref.on('value',snap=>{
    const msgs=[];
    snap.forEach(child=>{
      msgs.push({id:child.key,...child.val()});
    });
    callback(msgs);
  });
  messageListeners[chatId]=()=>ref.off('value',listener);
}

function stopMessageListener(chatId){
  if(messageListeners[chatId]){messageListeners[chatId]();delete messageListeners[chatId]}
}

// ===== MARK SEEN =====
async function markSeen(chatId){
  const myId=uid();
  if(!myId||!chatId)return;
  try{
    const snap=await REFS.messages.child(chatId).orderByChild('senderId').equalTo(myId).once('value');
    const updates={};
    snap.forEach(child=>{
      if(!child.val().seen)updates[child.key+'/seen']=true;
    });
    if(Object.keys(updates).length)await REFS.messages.child(chatId).update(updates);
  }catch(e){}
}

// ===== TYPING INDICATOR =====
function setTyping(chatId,typing){
  const myId=uid();
  if(!myId)return;
  REFS.presence.child(myId).child('typingIn').set(typing?chatId:null);
}

function listenTyping(chatId,callback){
  if(typingListeners[chatId])typingListeners[chatId]();
  const myId=uid();
  const ref=REFS.presence;
  const listener=ref.on('value',snap=>{
    snap.forEach(child=>{
      if(child.key!==myId){
        const data=child.val();
        if(data&&data.typingIn===chatId)callback(child.key);
      }
    });
  });
  typingListeners[chatId]=()=>ref.off('value',listener);
}

// ===== GET CHAT LIST =====
function listenChatList(callback){
  const myId=uid();
  if(!myId)return;
  REFS.chats.on('value',async snap=>{
    const chats=[];
    const promises=[];
    snap.forEach(child=>{
      const chat=child.val();
      if(chat.participants&&chat.participants[myId]){
        const partnerId=Object.keys(chat.participants).find(p=>p!==myId);
        const p=REFS.users.child(partnerId).once('value').then(userSnap=>{
          const user=userSnap.val();
          chats.push({
            id:child.key,
            partnerId,
            partnerName:user?.name||'Unknown',
            partnerImage:user?.profileImage||'',
            partnerOnline:user?.onlineStatus||false,
            lastMessage:chat.lastMessage||'',
            lastSender:chat.lastSender||'',
            lastTime:chat.lastTime||0
          });
        });
        promises.push(p);
      }
    });
    await Promise.all(promises);
    chats.sort((a,b)=>b.lastTime-a.lastTime);
    callback(chats);
  });
}

// ===== GET ONLINE USERS =====
function listenOnlineUsers(callback){
  const myId=uid();
  REFS.users.orderByChild('onlineStatus').equalTo(true).on('value',snap=>{
    const users=[];
    snap.forEach(child=>{
      if(child.key!==myId){
        const u=child.val();
        users.push({id:child.key,name:u.name,profileImage:u.profileImage||'',lastSeen:u.lastSeen});
      }
    });
    callback(users);
  });
}

// ===== SEND PUSH =====
async function sendPushNotification(token,title,body,chatId){
  try{
    const resp=await fetch('https://fcm.googleapis.com/fcm/send',{
      method:'POST',
      headers:{
        'Authorization':'key=AAAAz3E_kaQ:APA91bFhHNjNKb7r3Ghr6X6r0yf8MpYDuf22GA2Z2NR8AmrSJ2Cx9dNQdBQlrh9Sh7vXs3O6MqD_HJxpJBmhT7nGH3M80A_LBYonXg8lBcPP1BJCY3VYMB-KyH7q7UXVKjNjnl4YZXtBLjL05_V_NrT32V8XlQ9Jhg',
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        to:token,
        notification:{title,body,sound:'default',click_action:'.'+chatId},
        data:{chatId,click_action:'.'+chatId}
      })
    });
  }catch(e){}
}

// ===== DELETE MESSAGE =====
async function deleteMessage(chatId,msgId){
  try{
    await REFS.messages.child(chatId).child(msgId).remove();
  }catch(e){toast('Delete failed','error')}
}

// ===== IMAGE UPLOAD =====
async function uploadChatImage(chatId,blob){
  try{
    const ext=blob.type==='image/png'?'png':'jpg';
    const name=generateId()+'.'+ext;
    return await ghUpload('uploads/chats/'+chatId+'/'+name,blob,'Chat image');
  }catch(e){toast('Image upload failed','error');return null}
}

// ===== GET USER BY ID =====
async function getUserById(userId){
  try{
    const snap=await REFS.users.child(userId).once('value');
    return snap.val();
  }catch(e){return null}
}

// ===== GET UNREAD COUNT =====
function listenUnreadCount(callback){
  const myId=uid();
  if(!myId)return;
  REFS.messages.on('value',snap=>{
    let count=0;
    snap.forEach(chatSnap=>{
      const chatId=chatSnap.key;
      // Check if this chat involves me
      if(chatId.includes(myId)){
        chatSnap.forEach(msgSnap=>{
          const msg=msgSnap.val();
          if(msg.senderId!==myId&&!msg.seen)count++;
        });
      }
    });
    callback(count);
  });
}
