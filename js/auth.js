// ===== AUTH STATE =====
let currentUser=null;
let authListeners=[];

function onAuthStateChange(fn){authListeners.push(fn)}

function notifyAuthState(user){
  currentUser=user;
  authListeners.forEach(f=>f(user));
}

// ===== PERSIST SESSION =====
function saveSession(uid,data){
  const session={uid,...data};
  setSession(session);
  localStorage.setItem('uid',uid);
}

// ===== SHA-256 HASH =====
async function sha256(msg){
  const enc=new TextEncoder().encode(msg);
  const buf=await crypto.subtle.digest('SHA-256',enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ===== REGISTER =====
async function registerUser(name,password,imageBlob){
  try{
    const userId=generateId();
    const passwordHash=await sha256(password);

    let profileImage='';
    if(imageBlob){
      try{
        profileImage=await ghUpload('uploads/profiles/'+userId+'.jpg',imageBlob,'Profile '+name);
      }catch(e){toast('Image upload failed, continuing','error')}
    }

    const userData={
      userId,
      name,
      passwordHash,
      profileImage,
      onlineStatus:true,
      lastSeen:Date.now(),
      createdAt:Date.now(),
      fcmToken:''
    };

    await REFS.users.child(userId).set(userData);
    saveSession(userId,{name,profileImage});
    notifyAuthState(userData);
    return userId;
  }catch(e){
    toast('Registration failed: '+e.message,'error');
    throw e;
  }
}

// ===== LOGIN =====
async function loginUser(password){
  try{
    const uid=localStorage.getItem('uid');
    if(!uid){toast('No user found. Register first.','error');return null}
    const snap=await REFS.users.child(uid).once('value');
    const user=snap.val();
    if(!user){toast('User not found','error');return null}
    const hash=await sha256(password);
    if(hash!==user.passwordHash){toast('Wrong password','error');return null}
    await REFS.users.child(uid).update({onlineStatus:true,lastSeen:Date.now()});
    saveSession(uid,{name:user.name,profileImage:user.profileImage||''});
    notifyAuthState(user);
    return user;
  }catch(e){
    toast('Login failed: '+e.message,'error');
    return null;
  }
}

// ===== AUTO LOGIN =====
async function autoLogin(){
  const session=getSession();
  if(!session||!session.uid)return false;
  try{
    const snap=await REFS.users.child(session.uid).once('value');
    const user=snap.val();
    if(!user){clearSession();return false}
    if(user.passwordHash){
      localStorage.setItem('uid',session.uid);
      await REFS.users.child(session.uid).update({onlineStatus:true,lastSeen:Date.now()});
      notifyAuthState(user);
      return true;
    }
    return false;
  }catch(e){
    return false;
  }
}

// ===== LOGOUT =====
async function logout(){
  const uid=localStorage.getItem('uid');
  if(uid){
    try{
      await REFS.users.child(uid).update({onlineStatus:false,lastSeen:Date.now()});
    }catch(e){}
    try{
      if(typeof firebase!=='undefined'&&firebase.messaging){
        const m=firebase.messaging();
        m.deleteToken().catch(()=>{});
      }
      await REFS.users.child(uid).update({fcmToken:''});
    }catch(e){}
  }
  clearSession();
  notifyAuthState(null);
  goTo('login.html');
}

// ===== PRESENCE =====
let presenceRef=null;
function initPresence(){
  const uid=localStorage.getItem('uid');
  if(!uid)return;
  presenceRef=REFS.presence.child(uid);
  presenceRef.set({online:true,lastSeen:Date.now()});
  presenceRef.onDisconnect().set({online:false,lastSeen:Date.now()});
  window.addEventListener('beforeunload',()=>{
    presenceRef.set({online:false,lastSeen:Date.now()});
  });
}

// ===== AUTH INIT =====
document.addEventListener('DOMContentLoaded',async()=>{
  const loggedIn=await autoLogin();
  if(loggedIn){
    initPresence();
    const page=window.location.pathname.split('/').pop();
    if(page==='login.html'||page==='registration.html'||page==='index.html'){
      goTo('home.html');
    }
  }
});
