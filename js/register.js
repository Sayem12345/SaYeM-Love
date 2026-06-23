document.addEventListener('DOMContentLoaded',()=>{
  if(checkAuth()){location.href='../index.html';return}
  document.getElementById('regUsername').addEventListener('input',debounce(chkUn,500));
  document.getElementById('regPassword').addEventListener('input',chkStr);
  document.getElementById('regConfirm').addEventListener('input',chkMatch);
  document.getElementById('registerForm').addEventListener('submit',onReg);
});

async function chkUn(){
  const un=document.getElementById('regUsername').value.trim();
  const st=document.getElementById('regUsernameStatus');
  if(!un){st.textContent='';st.className='field-status';return}
  if(un.length<3){st.textContent='Min 3 chars';st.className='field-status err';return}
  const ok=await unavail(un);
  st.textContent=ok?'Available':'Taken';
  st.className='field-status '+(ok?'ok':'err');
}

function chkStr(){
  const pw=document.getElementById('regPassword').value;
  const el=document.getElementById('regStrength');
  if(!pw){el.textContent='';el.className='field-hint';return}
  let s=0;
  if(pw.length>=6)s++;if(pw.length>=10)s++;
  if(/[A-Z]/.test(pw))s++;if(/[0-9]/.test(pw))s++;if(/[^A-Za-z0-9]/.test(pw))s++;
  if(s<=1){el.textContent='Weak';el.className='field-hint w'}
  else if(s<=3){el.textContent='Medium';el.className='field-hint m'}
  else{el.textContent='Strong';el.className='field-hint s'}
}

function chkMatch(){
  const pw=document.getElementById('regPassword').value;
  const cf=document.getElementById('regConfirm').value;
  const el=document.getElementById('regStrength');
  if(!cf)return;
  if(pw!==cf){el.textContent='Passwords do not match';el.className='field-hint w'}
  else chkStr();
}

async function onReg(e){
  e.preventDefault();
  const name=document.getElementById('regName').value.trim();
  const un=document.getElementById('regUsername').value.trim();
  const pw=document.getElementById('regPassword').value;
  const cf=document.getElementById('regConfirm').value;
  const btn=document.getElementById('registerBtn');
  if(!name||!un||!pw||!cf){toast('Fill all fields','err');return}
  if(pw!==cf){toast('Passwords do not match','err');return}
  if(pw.length<6){toast('Password too short (min 6)','err');return}
  if(un.length<3){toast('Username too short (min 3)','err');return}
  btnLoad(btn,true);
  try{
    await registerUser(name,un,pw);
    toast('Account created!','ok');
    setTimeout(()=>location.href='../index.html',400);
  }catch(err){
    toast(err,'err');
    btnLoad(btn,false);
  }
}
