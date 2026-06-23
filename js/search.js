// ===== SEARCH USERS =====
function searchUsers(query,callback){
  if(!query||query.length<1){callback([]);return}
  const q=query.toLowerCase();
  REFS.users.once('value',snap=>{
    const results=[];
    snap.forEach(child=>{
      const u=child.val();
      if(u.name&&u.name.toLowerCase().includes(q)){
        results.push({id:child.key,...u});
      }
    });
    callback(results);
  });
}

// ===== SEARCH CHATS =====
function searchChats(query,callback){
  const myId=uid();
  if(!myId)return;
  const q=query.toLowerCase();
  REFS.chats.once('value',async snap=>{
    const results=[];
    const promises=[];
    snap.forEach(child=>{
      const chat=child.val();
      if(chat.participants&&chat.participants[myId]&&(!q||(chat.lastMessage||'').toLowerCase().includes(q))){
        const partnerId=Object.keys(chat.participants).find(p=>p!==myId);
        const p=REFS.users.child(partnerId).once('value').then(uSnap=>{
          const u=uSnap.val();
          results.push({
            id:child.key,
            partnerId,
            partnerName:u?.name||'Unknown',
            partnerImage:u?.profileImage||'',
            lastMessage:chat.lastMessage||'',
            lastTime:chat.lastTime||0
          });
        });
        promises.push(p);
      }
    });
    await Promise.all(promises);
    callback(results);
  });
}

// ===== SEARCH INBOX (messages) =====
function searchInbox(query,callback){
  const myId=uid();
  if(!myId||!query)return;
  const q=query.toLowerCase();
  REFS.messages.once('value',snap=>{
    const results=[];
    const promises=[];
    snap.forEach(chatSnap=>{
      const chatId=chatSnap.key;
      if(chatId.includes(myId)){
        chatSnap.forEach(msgSnap=>{
          const msg=msgSnap.val();
          if(msg.text&&msg.text.toLowerCase().includes(q)){
            const partnerId=chatId.replace(myId,'').replace('_','');
            const p=REFS.users.child(partnerId).once('value').then(uSnap=>{
              const u=uSnap.val();
              results.push({
                chatId,
                partnerName:u?.name||'Unknown',
                text:msg.text,
                timestamp:msg.timestamp,
                senderId:msg.senderId
              });
            });
            promises.push(p);
          }
        });
      }
    });
    Promise.all(promises).then(()=>callback(results));
  });
}
