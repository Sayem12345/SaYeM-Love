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
    delivered:false,
    edited:false,
    deleted:null,
    pinned:false,
    starred:false,
    reactions:{}
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
    // Mark as delivered for sender
    await REFS.messages.child(chatId).child(msgId).update({delivered:true});
    // Send push notification
    const chatSnap=await REFS.chats.child(chatId).once('value');
    const participants=chatSnap.val().participants;
    const partnerId=Object.keys(participants).find(p=>p!==myId);
    if(partnerId){
      const userSnap=await REFS.users.child(partnerId).once('value');
      const partner=userSnap.val();
      if(partner&&partner.fcmToken){
        try{
          const senderName=currentUser?.name||'SEVEN';
          const senderImg=currentUser?.profileImage||'';
          const msgBody=text||'📷 Image';
          const msgTimestamp=Date.now();
          await fetch('https://fcm.googleapis.com/fcm/send',{
            method:'POST',
            headers:{
              'Authorization':'key=AAAAz3E_kaQ:APA91bFhHNjNKb7r3Ghr6X6r0yf8MpYDuf22GA2Z2NR8AmrSJ2Cx9dNQdBQlrh9Sh7vXs3O6MqD_HJxpJBmhT7nGH3M80A_LBYonXg8lBcPP1BJC3YVYMB-KyH7q7UXVKjNjnl4YZXtBLjL05_V_NrT32V8XlQ9Jhg',
              'Content-Type':'application/json'
            },
            body:JSON.stringify({
              to:partner.fcmToken,
              notification:{
                title:senderName,
                body:msgBody,
                sound:'default',
                icon:senderImg||''
              },
              data:{
                chatId,
                senderName,
                senderImage:senderImg,
                timestamp:msgTimestamp.toString(),
                body:msgBody,
                title:senderName,
                image:'',
                click_action:chatId
              }
            })
          });
        }catch(e){}
      }
    }
    if(SOUNDS.send)SOUNDS.send();
    if(localStorage.getItem('vibrate')!=='off')try{navigator.vibrate(20)}catch(e){}
    return msgId;
  }catch(e){toast('Send failed','error')}
}

// ===== LISTEN TO CHAT MESSAGES =====
function listenMessages(chatId,callback){
  if(messageListeners[chatId])messageListeners[chatId]();
  const ref=REFS.messages.child(chatId).orderByChild('timestamp').limitToLast(100);
  const listener=ref.on('value',snap=>{
    const msgs=[];
    const myId=uid();
    const updates={};
    snap.forEach(child=>{
      const m=child.val();
      if(m&&!m.deleted)msgs.push({id:child.key,...m});
      else if(m&&m.deleted)msgs.push({id:child.key,...m});
      // Mark as delivered if from partner
      if(m&&m.senderId!==myId&&!m.delivered)updates[child.key+'/delivered']=true;
    });
    if(Object.keys(updates).length)REFS.messages.child(chatId).update(updates);
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
  if(!myId||!chatId||localStorage.getItem('readReceipts')==='off')return;
  try{
    const snap=await REFS.messages.child(chatId).once('value');
    const updates={};
    snap.forEach(child=>{
      const m=child.val();
      if(m&&m.senderId!==myId&&!m.seen)updates[child.key+'/seen']=true;
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
    const chats=[],archived=[];
    const promises=[];
    snap.forEach(child=>{
      const chat=child.val();
      if(chat.participants&&chat.participants[myId]){
        const partnerId=Object.keys(chat.participants).find(p=>p!==myId);
        const p=REFS.users.child(partnerId).once('value').then(userSnap=>{
          const user=userSnap.val();
          const item={
            id:child.key,
            partnerId,
            partnerName:user?.name||'Unknown',
            partnerImage:user?.profileImage||'',
            partnerOnline:user?.onlineStatus||false,
            lastMessage:chat.lastMessage||'',
            lastSender:chat.lastSender||'',
            lastTime:chat.lastTime||0,
            pinned:chat.pinned||false,
            archived:chat.archived||false,
            _unread:0
          };
          if(chat.archived)archived.push(item);else chats.push(item);
        });
        promises.push(p);
      }
    });
    await Promise.all(promises);
    // Compute unread counts
    const all=[...chats,...archived];
    const unreadPromises=all.map(item=>
      REFS.messages.child(item.id).orderByChild('senderId').once('value').then(msgSnap=>{
        msgSnap.forEach(msg=>{
          const m=msg.val();
          if(m.senderId!==myId&&!m.seen)item._unread++;
        });
      })
    );
    await Promise.all(unreadPromises);
    chats.sort((a,b)=>b.lastTime-a.lastTime);
    archived.sort((a,b)=>b.lastTime-a.lastTime);
    // Pinned at top
    const pinned=chats.filter(c=>c.pinned);
    const unpinned=chats.filter(c=>!c.pinned);
    callback([...pinned,...unpinned],archived);
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

// ===== GET CHATS FOR FORWARD =====
function getMyChats(callback){
  const myId=uid();
  if(!myId)return;
  REFS.chats.once('value',async snap=>{
    const chats=[];
    const promises=[];
    snap.forEach(child=>{
      const chat=child.val();
      if(chat.participants&&chat.participants[myId]){
        const partnerId=Object.keys(chat.participants).find(p=>p!==myId);
        const p=REFS.users.child(partnerId).once('value').then(uSnap=>{
          const u=uSnap.val();
          if(u)chats.push({id:child.key,partnerId,partnerName:u.name||'Unknown',partnerImage:u.profileImage||''});
        });
        promises.push(p);
      }
    });
    await Promise.all(promises);
    callback(chats);
  });
}

// ===== IMAGE UPLOAD =====
async function uploadChatImage(chatId,blob,onProgress){
  try{
    const ext=blob.type==='image/png'?'png':'jpg';
    const name=generateId()+'.'+ext;
    return await ghUpload('uploads/chats/'+chatId+'/'+name,blob,'Chat image',onProgress);
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
  const myChats={};
  REFS.chats.on('value',chatSnap=>{
    chatSnap.forEach(child=>{
      const chat=child.val();
      if(chat.participants&&chat.participants[myId])myChats[child.key]=true;
    });
    let count=0;
    const pending=Object.keys(myChats);
    if(!pending.length){callback(0);return}
    let done=0;
    pending.forEach(chatId=>{
      REFS.messages.child(chatId).orderByChild('senderId').once('value',snap=>{
        snap.forEach(msgSnap=>{
          const msg=msgSnap.val();
          if(msg.senderId!==myId&&!msg.seen)count++;
        });
        done++;
        if(done===pending.length)callback(count);
      });
    });
  });
}
