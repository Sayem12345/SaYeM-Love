// ===== LOAD PROFILE =====
async function loadProfile(userId){
  try{
    const user=await getUserById(userId);
    if(!user)return;
    const $img=document.getElementById('profileImage');
    const $name=document.getElementById('profileName');
    const $username=document.getElementById('profileUsername');
    const $bio=document.getElementById('profileBio');
    const $friends=document.getElementById('profileFriends');
    const $chats=document.getElementById('profileChats');
    if($img){
      if(user.profileImage)$img.src=user.profileImage;
      else $img.src='';
    }
    if($name)$name.textContent=user.name||'User';
    if($username)$username.textContent='@'+(user.userId||'').slice(-6);
    if($bio)$bio.textContent=user.bio||'No bio yet';
    if($friends){
      // Count friends (chats with this user)
      try{
        const snap=await REFS.chats.once('value');
        let count=0;
        snap.forEach(child=>{
          const chat=child.val();
          if(chat.participants&&chat.participants[userId])count++;
        });
        $friends.textContent=count-1||0;
      }catch(e){$friends.textContent='0'}
    }
    if($chats){
      try{
        const snap=await REFS.chats.once('value');
        let count=0;
        snap.forEach(child=>{
          const chat=child.val();
          if(chat.participants&&chat.participants[userId])count++;
        });
        $chats.textContent=count-1||0;
      }catch(e){$chats.textContent='0'}
    }
    return user;
  }catch(e){return null}
}

// ===== UPDATE PROFILE =====
async function updateProfile(data){
  const uid=localStorage.getItem('uid');
  if(!uid)return;
  try{
    await REFS.users.child(uid).update(data);
    toast('Profile updated','success');
    return true;
  }catch(e){toast('Update failed','error');return false}
}

// ===== UPDATE PROFILE IMAGE =====
async function updateProfileImage(blob){
  const uid=localStorage.getItem('uid');
  if(!uid)return;
  try{
    const url=await ghUpload('uploads/profiles/'+uid+'.jpg',blob,'Profile update');
    await updateProfile({profileImage:url});
    return url;
  }catch(e){toast('Image upload failed','error');return null}
}

// ===== LOAD OWN PROFILE =====
async function loadMyProfile(){
  const uid=localStorage.getItem('uid');
  if(!uid)return;
  return loadProfile(uid);
}
