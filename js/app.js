document.addEventListener('DOMContentLoaded',init);

async function init(){
  if(checkAuth()){
    try{
      await database.ref('users/'+currentUserId+'/online').set(true);
      await database.ref('users/'+currentUserId+'/lastSeen').set(Date.now());
      const d=await getUser(currentUserId);
      if(d)currentUser={...currentUser,fullName:d.fullName,avatar:d.avatar};
      if(notifEnabled)setupNotifications();
      goApp();
    }catch(e){handleLogout()}
  }else{
    setTimeout(()=>location.href='pages/login.html',1500);
  }
}

function goApp(){
  const s=document.querySelector('.splash-screen');
  setTimeout(()=>{
    s.classList.add('hide');
    setTimeout(()=>{s.style.display='none';location.href='pages/chat.html'},500);
  },1000);
}

window.addEventListener('beforeunload',()=>{
  if(currentUserId){
    database.ref('users/'+currentUserId+'/online').set(false);
    database.ref('users/'+currentUserId+'/lastSeen').set(Date.now());
  }
});

document.addEventListener('visibilitychange',()=>{
  if(!currentUserId)return;
  if(document.visibilityState==='visible'){
    database.ref('users/'+currentUserId+'/online').set(true);
  }else{
    database.ref('users/'+currentUserId+'/online').set(false);
    database.ref('users/'+currentUserId+'/lastSeen').set(Date.now());
  }
});
