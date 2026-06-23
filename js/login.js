document.addEventListener('DOMContentLoaded',()=>{
  if(checkAuth()){location.href='../index.html';return}
  document.getElementById('loginForm').addEventListener('submit',onLogin);
});

async function onLogin(e){
  e.preventDefault();
  const un=document.getElementById('loginUsername').value.trim();
  const pw=document.getElementById('loginPassword').value;
  const btn=document.getElementById('loginBtn');
  if(!un||!pw){toast('Fill all fields','err');return}
  btnLoad(btn,true);
  try{
    await loginUser(un,pw);
    toast('Welcome back!','ok');
    setTimeout(()=>location.href='../index.html',400);
  }catch(err){
    toast(err,'err');
    btnLoad(btn,false);
  }
}
