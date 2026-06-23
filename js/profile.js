document.addEventListener('DOMContentLoaded',()=>{
  if(!requireAuth())return;
  loadProfile();
});

function backHome(){location.href='../index.html'}
function goSettings(){location.href='settings.html'}

async function loadProfile(){
  try{
    const d=await getUser(currentUserId);
    if(!d){toast('Failed to load profile','err');return}
    document.getElementById('profAvatar').src=d.avatar||'../assets/images/default-avatar.svg';
    document.getElementById('profName').value=d.fullName||'';
    document.getElementById('profUsername').value=d.username||'';
    document.getElementById('profPass').value='';
    document.getElementById('profConfirm').value='';
  }catch(e){toast('Failed to load profile','err')}
}

function enableEdit(id){
  const inp=document.getElementById(id);
  if(id==='profUsername'){
    inp.readOnly=false;inp.focus();
    if(!inp.dataset.listener){
      inp.addEventListener('input',debounce(chkProfUn,500));
      inp.dataset.listener='1';
    }
  }else if(id==='profPass'){inp.focus()}
  else{inp.readOnly=false;inp.focus()}
}

async function chkProfUn(){
  const un=document.getElementById('profUsername').value.trim();
  const st=document.getElementById('profUsernameStatus');
  if(!un){st.textContent='';st.className='prof-status';return}
  if(un===localStorage.getItem('sun')){st.textContent='Current';st.className='prof-status';return}
  const ok=await unavail(un);
  st.textContent=ok?'Available':'Taken';
  st.className='prof-status '+(ok?'ok':'err');
}

async function saveProfile(){
  const name=document.getElementById('profName').value.trim();
  const un=document.getElementById('profUsername').value.trim();
  const pw=document.getElementById('profPass').value;
  const cf=document.getElementById('profConfirm').value;
  if(!name){toast('Name cannot be empty','err');return}
  const upd={};
  if(name)upd.fullName=name;
  if(un&&un!==localStorage.getItem('sun')){
    if(un.length<3){toast('Username too short','err');return}
    const ok=await unavail(un);
    if(!ok){toast('Username taken','err');return}
    upd.username=un.toLowerCase();
  }
  try{
    if(pw||cf){
      if(pw!==cf){toast('Passwords do not match','err');return}
      if(pw.length<6){toast('Password too short','err');return}
      await chgPass(currentUserId,pw);
    }
    if(Object.keys(upd).length>0)await updUser(currentUserId,upd);
    if(upd.fullName)localStorage.setItem('sname',upd.fullName);
    if(upd.username)localStorage.setItem('sun',upd.username);
    toast('Profile updated!','ok');
    loadProfile();
  }catch(e){toast('Update failed','err')}
}

function pickAvatar(){document.getElementById('avatarPick').click()}

async function changeAvatar(e){
  const file=e.target.files[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){toast('Select an image','err');return}
  toast('Uploading...');
  try{
    const token=typeof GITHUB_TOKEN!=='undefined'?GITHUB_TOKEN:'';
    if(!token){toast('GitHub token not configured','err');return}
    const compressed=await compressImg(file);
    const b64=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.readAsDataURL(compressed)});
    const fn='avatar_'+currentUserId+'.jpg';
    const path='avatars/'+currentUserId+'/'+fn;
    const resp=await fetch('https://api.github.com/repos/Sayem12345/SaYeM-Love/contents/'+path,{
      method:'PUT',
      headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({message:'Upload avatar',content:b64,branch:'main'})
    });
    if(!resp.ok)throw new Error('Upload failed');
    const d=await resp.json();
    const url='https://raw.githubusercontent.com/Sayem12345/SaYeM-Love/main/'+path;
    await database.ref('users/'+currentUserId+'/avatar').set(url);
    document.getElementById('profAvatar').src=url;
    toast('Avatar updated!','ok');
  }catch(err){toast('Upload failed','err')}
}
