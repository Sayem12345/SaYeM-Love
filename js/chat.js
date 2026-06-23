let currentChat = null;
let currentPartner = null;
let replyTarget = null;
let msgListener = null;
let typingListener = null;
let listListener = null;

document.addEventListener('DOMContentLoaded',()=>{
  if(!requireAuth())return;
  loadChatList();
});

function loadChatList(){
  const list=document.getElementById('chatList');
  const empty=document.getElementById('emptyChats');
  if(listListener)offRef(listListener);
  listListener=database.ref('chats').orderByChild('participants/'+currentUserId).equalTo(true);
  listListener.on('value',snap=>{
    const chats=[];
    snap.forEach(c=>{const ch=c.val();ch.id=c.key;if(ch.lastMessage)chats.push(ch)});
    chats.sort((a,b)=>(b.lastMessage?.timestamp||0)-(a.lastMessage?.timestamp||0));
    if(chats.length===0){list.innerHTML='';empty.style.display='flex';return}
    empty.style.display='none';
    list.innerHTML=chats.map(ch=>{
      const pid=Object.keys(ch.participants||{}).find(id=>id!==currentUserId);
      const on=ch.participantStatus?.[pid]?.online;
      const unread=ch.unread?.[currentUserId]||0;
      return `
        <div class="chat-item" onclick="openChat('${ch.id}','${pid}')">
          <div class="ch-item-av">
            <img src="${ch.participantData?.[pid]?.avatar||'assets/images/default-avatar.svg'}" alt="" onerror="this.src='assets/images/default-avatar.svg'">
            <span class="dot ${on?'':'off'}"></span>
          </div>
          <div class="ch-item-info">
            <div class="ch-item-name">
              ${esc(ch.participantData?.[pid]?.fullName||ch.participantData?.[pid]?.username||'User')}
              ${unread>0?`<span class="unread-badge">${unread}</span>`:''}
            </div>
            <div class="ch-item-last">${esc(ch.lastMessage?.text||(ch.lastMessage?.hasImage?'Photo':''))}</div>
          </div>
          <div class="ch-item-meta">
            <div class="ch-item-time">${fmtTime(ch.lastMessage?.timestamp)}</div>
          </div>
        </div>
      `;
    }).join('');
  });
}

async function openChat(chatId,partnerId){
  currentChat=chatId;
  currentPartner=partnerId;
  replyTarget=null;
  const data=await getUser(partnerId);
  if(!data)return;
  document.getElementById('convAvatar').src=data.avatar||'../assets/images/default-avatar.svg';
  document.getElementById('convName').textContent=data.fullName||data.username;
  updStatus(data);
  document.getElementById('chatListView').classList.remove('active');
  document.getElementById('convView').classList.add('active');
  clearUnread(chatId);
  loadMessages(chatId);
  listenTyping(chatId,partnerId);
  database.ref('chats/'+chatId+'/participantStatus/'+partnerId).on('value',s=>{
    const st=s.val();if(st)updStatus(st);
  });
}

function updStatus(data){
  const dot=document.getElementById('convOnline');
  const st=document.getElementById('convStatus');
  const on=data.online===true;
  dot.className='dot '+(on?'':'off');
  st.textContent=on?'Online':'Last seen '+fmtLast(data.lastSeen);
}

function closeConv(){
  currentChat=null;currentPartner=null;replyTarget=null;
  if(msgListener)offRef(msgListener);
  if(typingListener)offRef(typingListener);
  document.getElementById('convView').classList.remove('active');
  document.getElementById('chatListView').classList.add('active');
  document.getElementById('msgList').innerHTML='';
  document.getElementById('typingBox').style.display='none';
}

function loadMessages(chatId){
  if(msgListener)offRef(msgListener);
  document.getElementById('msgList').innerHTML='';
  msgListener=database.ref('chats/'+chatId+'/messages').orderByChild('timestamp').limitToLast(100);
  msgListener.on('child_added',snap=>{
    const msg=snap.val();msg.id=snap.key;
    addMsg(msg,chatId);
    if(msg.senderId!==currentUserId)markSeen(chatId,msg.id);
  });
  msgListener.on('child_changed',snap=>{
    const msg=snap.val();msg.id=snap.key;
    const el=document.getElementById('msg-'+msg.id);
    if(!el)return;
    const se=el.querySelector('.msg-status');
    if(se){se.innerHTML=getStatusIcon(msg.status);se.className='msg-status '+(msg.status==='seen'?'seen':'')}
  });
}

function addMsg(msg,chatId){
  const list=document.getElementById('msgList');
  const sent=msg.senderId===currentUserId;
  if(document.getElementById('msg-'+msg.id))return;
  const div=document.createElement('div');
  div.id='msg-'+msg.id;
  div.className='msg '+(sent?'sent':'recv');
  let h='';
  if(msg.replyTo)h+=`<div class="msg-reply">${esc(msg.replyTo.text||'Photo')}</div>`;
  if(msg.imageUrl)h+=`<img src="${msg.imageUrl}" class="msg-img" onclick="openImg('${msg.imageUrl}')" alt="" loading="lazy">`;
  if(msg.text)h+=`<div class="msg-text">${esc(msg.text)}</div>`;
  const si=sent?getStatusIcon(msg.status):'';
  h+=`<div class="msg-meta"><span class="msg-time">${fmtTime(msg.timestamp)}</span>${si?`<span class="msg-status ${msg.status==='seen'?'seen':''}">${si}</span>`:''}</div>`;
  div.innerHTML=h;
  list.appendChild(div);
  scrollDown();
}

function getStatusIcon(s){
  if(s==='sent')return '<i class="fas fa-check" style="font-size:.65rem"></i>';
  if(s==='delivered')return '<i class="fas fa-check-double" style="font-size:.65rem"></i>';
  if(s==='seen')return '<i class="fas fa-check-double" style="font-size:.65rem;color:#4fc3f7"></i>';
  return '';
}

function markSeen(chatId,msgId){
  database.ref('chats/'+chatId+'/messages/'+msgId+'/status').once('value',s=>{
    if(s.val()!=='seen')database.ref('chats/'+chatId+'/messages/'+msgId+'/status').set('seen');
  });
}

async function sendMsg(){
  const input=document.getElementById('msgInput');
  const text=input.value.trim();
  if(!text&&!pendingImage)return;
  if(!currentChat||!currentPartner)return;
  const id=uid();
  const data={id,senderId:currentUserId,text:text||'',timestamp:Date.now(),status:'sent',replyTo:replyTarget?{text:replyTarget.text,senderId:replyTarget.senderId}:null};
  if(pendingImage){data.imageUrl=pendingImage;data.hasImage=true;pendingImage=null}
  input.value='';input.style.height='auto';
  replyTarget=null;document.getElementById('replyBox').style.display='none';
  const upd={};
  upd['chats/'+currentChat+'/messages/'+id]=data;
  upd['chats/'+currentChat+'/lastMessage']={text:text||'Photo',senderId:currentUserId,timestamp:Date.now(),hasImage:!!data.imageUrl};
  upd['chats/'+currentChat+'/unread/'+currentPartner]=firebase.database.ServerValue.increment(1);
  try{
    await database.ref().update(upd);
    await database.ref('chats/'+currentChat+'/messages/'+id+'/status').set('sent');
    setTimeout(()=>database.ref('chats/'+currentChat+'/messages/'+id+'/status').set('delivered'),500);
    const pd=await getUser(currentPartner);
    if(pd&&pd.fcmToken){try{sendPush(currentPartner,'New Message',(currentUser.fullName||currentUser.username)+': '+(text||'Photo'),{chatId:currentChat,senderId:currentUserId})}catch(e){}}
  }catch(e){toast('Send failed','err')}
  stopTyping();
}

let pendingImage=null;

function pickImage(){
  document.getElementById('imagePick').click();
}

async function sendImage(e){
  const file=e.target.files[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){toast('Select an image','err');return}
  if(file.size>5*1024*1024){toast('Image too large (max 5MB)','err');return}
  toast('Uploading...');
  try{
    const token=typeof GITHUB_TOKEN!=='undefined'?GITHUB_TOKEN:'';
    if(!token){toast('GitHub token not configured','err');return}
    const compressed=await compressImg(file);
    const b64=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.readAsDataURL(compressed)});
    const fn=Date.now()+'_'+file.name.replace(/[^a-zA-Z0-9.]/g,'_');
    const path='chats/'+currentChat+'/'+fn;
    const resp=await fetch('https://api.github.com/repos/Sayem12345/SaYeM-Love/contents/'+path,{
      method:'PUT',
      headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({message:'Upload '+fn,content:b64,branch:'main'})
    });
    if(!resp.ok)throw new Error('Upload failed');
    const d=await resp.json();
    pendingImage='https://raw.githubusercontent.com/Sayem12345/SaYeM-Love/main/'+path;
    sendMsg();
  }catch(err){toast('Upload failed','err')}
}

function scrollDown(){
  requestAnimationFrame(()=>{document.getElementById('msgWrap').scrollTop=document.getElementById('msgWrap').scrollHeight});
}

function clearUnread(chatId){
  database.ref('chats/'+chatId+'/unread/'+currentUserId).remove();
}

async function startChat(userId,username,fullName,avatar){
  closeSearch();
  const exist=await findChat(userId);
  if(exist){openChat(exist,userId);return}
  const id=uid();
  const data={
    participants:{[currentUserId]:true,[userId]:true},
    participantStatus:{[currentUserId]:{online:true},[userId]:{online:false}},
    participantData:{[currentUserId]:{username:currentUser.username,fullName:localStorage.getItem('sname'),avatar:''},[userId]:{username,fullName,avatar}},
    createdAt:Date.now()
  };
  try{await database.ref('chats/'+id).set(data);openChat(id,userId)}
  catch(e){toast('Failed to create chat','err')}
}

function findChat(userId){
  return new Promise(r=>{
    database.ref('chats').orderByChild('participants/'+currentUserId).equalTo(true).once('value',snap=>{
      let found=null;
      snap.forEach(c=>{const ch=c.val();if(ch.participants&&ch.participants[userId]){found=c.key;return true}});
      r(found);
    });
  });
}

function typing(){
  if(!currentChat)return;
  database.ref('chats/'+currentChat+'/typing/'+currentUserId).set({isTyping:true,timestamp:Date.now()});
  clearTimeout(window._ty);
  window._ty=setTimeout(stopTyping,2000);
}

function stopTyping(){
  if(!currentChat)return;
  database.ref('chats/'+currentChat+'/typing/'+currentUserId).remove();
}

function listenTyping(chatId,partnerId){
  if(typingListener)offRef(typingListener);
  typingListener=database.ref('chats/'+chatId+'/typing/'+partnerId);
  typingListener.on('value',s=>{
    const d=s.val();
    const box=document.getElementById('typingBox');
    if(d&&d.isTyping){box.style.display='flex'}else{box.style.display='none'}
  });
}

function setReply(id,text,sender){
  replyTarget={id,text,senderId:sender};
  document.getElementById('replyBox').style.display='flex';
  document.getElementById('replyText').textContent=text||'Photo';
}

function cancelReply(){replyTarget=null;document.getElementById('replyBox').style.display='none'}

function openImg(url){
  document.getElementById('fullImg').src=url;
  document.getElementById('imgModal').style.display='flex';
}

function closeImg(){document.getElementById('imgModal').style.display='none'}

function downloadImg(){
  const a=document.createElement('a');
  a.href=document.getElementById('fullImg').src;
  a.download='image.jpg';
  a.click();
}

function showUserInfo(){
  if(!currentPartner)return;
  const modal=document.getElementById('userModal');
  getUser(currentPartner).then(d=>{
    if(!d)return;
    document.getElementById('userInfoAvatar').src=d.avatar||'../assets/images/default-avatar.svg';
    document.getElementById('userInfoName').textContent=d.fullName||d.username;
    document.getElementById('userInfoUsername').textContent=d.username;
    document.getElementById('userInfoOnline').style.display=d.online?'inline-flex':'none';
    document.getElementById('userInfoOffline').style.display=d.online?'none':'inline-flex';
    document.getElementById('userInfoLast').textContent=fmtLast(d.lastSeen);
    modal.style.display='flex';
  });
}

function closeUserInfo(){document.getElementById('userModal').style.display='none'}

function goProfile(){location.href='profile.html'}
