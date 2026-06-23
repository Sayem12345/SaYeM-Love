function checkAuth(){
  const id=localStorage.getItem('suid'),un=localStorage.getItem('sun');
  if(id&&un){currentUserId=id;currentUser={username:un};return true}
  return false;
}

function requireAuth(){
  if(!checkAuth()){location.href='login.html';return false}
  return true;
}

function handleLogout(){
  if(currentUserId){
    database.ref('users/'+currentUserId+'/online').set(false);
    database.ref('users/'+currentUserId+'/lastSeen').set(Date.now());
    database.ref('users/'+currentUserId+'/fcmToken').remove();
  }
  localStorage.removeItem('suid');
  localStorage.removeItem('sun');
  localStorage.removeItem('sname');
  currentUserId=null;currentUser=null;
  clearRefs();
  location.href='login.html';
}

function registerUser(name,username,password){
  return new Promise((resolve,reject)=>{
    database.ref('users').orderByChild('username').equalTo(username.toLowerCase()).once('value',snap=>{
      if(snap.exists()){reject('Username taken');return}
      const ref=database.ref('users').push();
      const id=ref.key;
      const data={
        id,fullName:name,username:username.toLowerCase(),
        password:btoa(password),avatar:'',online:false,
        lastSeen:Date.now(),createdAt:Date.now(),fcmToken:''
      };
      ref.set(data).then(()=>{
        localStorage.setItem('suid',id);
        localStorage.setItem('sun',username.toLowerCase());
        localStorage.setItem('sname',name);
        currentUserId=id;
        currentUser={username:username.toLowerCase(),fullName:name,id};
        resolve(data);
      }).catch(reject);
    });
  });
}

function loginUser(username,password){
  return new Promise((resolve,reject)=>{
    database.ref('users').orderByChild('username').equalTo(username.toLowerCase()).once('value',snap=>{
      if(!snap.exists()){reject('User not found');return}
      let data=null,id=null;
      snap.forEach(c=>{data=c.val();id=c.key});
      try{if(atob(data.password)!==password){reject('Wrong password');return}}
      catch(e){reject('Wrong password');return}
      localStorage.setItem('suid',id);
      localStorage.setItem('sun',username.toLowerCase());
      localStorage.setItem('sname',data.fullName);
      currentUserId=id;
      currentUser={username:username.toLowerCase(),fullName:data.fullName,id};
      database.ref('users/'+id+'/online').set(true);
      database.ref('users/'+id+'/lastSeen').set(Date.now());
      resolve(data);
    });
  });
}

function getUser(id){
  return database.ref('users/'+id).once('value').then(s=>s.val());
}

function updUser(id,upd){
  return database.ref('users/'+id).update(upd);
}

function chgPass(id,pw){
  return database.ref('users/'+id+'/password').set(btoa(pw));
}

function unavail(un){
  return database.ref('users').orderByChild('username').equalTo(un.toLowerCase()).once('value').then(s=>!s.exists());
}
