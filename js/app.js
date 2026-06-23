// ===== UTILITIES =====
const $=id=>document.getElementById(id);
const $$=sel=>document.querySelectorAll(sel);
const qs=sel=>document.querySelector(sel);

// Load GitHub token from storage into memory
try{const t=localStorage.getItem('gt');if(t)window.__GT=t}catch(e){}

function toast(msg,type=''){
  const t=document.createElement('div');
  t.className='toast'+(type?' '+type:'');
  t.textContent=msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},2500);
}

function formatTime(ts){
  if(!ts)return'';
  const d=new Date(ts);
  const now=new Date();
  const sameDay=d.toDateString()===now.toDateString();
  const yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
  const isYesterday=d.toDateString()===yesterday.toDateString();
  const time=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  if(sameDay)return time;
  if(isYesterday)return'Yesterday '+time;
  return d.toLocaleDateString([],{day:'numeric',month:'short'})+' '+time;
}

function formatLastSeen(ts){
  if(!ts)return'Offline';
  const d=new Date(ts);
  const now=new Date();
  const diff=Math.floor((now-d)/1000);
  if(diff<60)return'Online';
  if(diff<3600)return Math.floor(diff/60)+'m ago';
  if(diff<86400)return Math.floor(diff/3600)+'h ago';
  return d.toLocaleDateString([],{day:'numeric',month:'short'});
}

function uid(){return localStorage.getItem('uid')}
function getSession(){return JSON.parse(localStorage.getItem('session')||'null')}
function setSession(data){localStorage.setItem('session',JSON.stringify(data))}
function clearSession(){localStorage.removeItem('session');localStorage.removeItem('uid')}
function isLoggedIn(){return!!getSession()}

function goTo(page){
  if(page.includes('?'))window.location.href=page;
  else if(page.endsWith('.html'))window.location.href=page;
  else window.location.href=page+'.html';
}

function escapeHtml(str){
  const d=document.createElement('div');
  d.textContent=str;
  return d.innerHTML;
}

function debounce(fn,ms=300){
  let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms)}
}

function generateId(){
  return DB.ref().push().key;
}

// ===== GITHUB UPLOAD =====
async function ghUpload(path,blob,msg){
  const b64=await blobToBase64(blob);
  const p=b64.split(',')[1];
  let sha=null;
  try{
    const r=await fetch('https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/contents/'+path+'?ref='+GH.branch,{
      headers:{'Authorization':'Bearer '+GH.token,'Accept':'application/vnd.github+json'}
    });
    if(r.ok){const d=await r.json();sha=d.sha||null}
  }catch(e){}
  const u='https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/contents/'+path;
  const body={message:msg||'Upload '+path,content:p,branch:GH.branch};
  if(sha)body.sha=sha;
  const r=await fetch(u,{method:'PUT',headers:{'Authorization':'Bearer '+GH.token,'Accept':'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('Upload failed: '+r.status);
  return GH.raw+'/'+path;
}

function blobToBase64(blob){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=rej;
    r.readAsDataURL(blob)
  })
}

// ===== SOUNDS =====
const SOUNDS={};
function initSounds(){
  const ctx=new(window.AudioContext||window.webkitAudioContext);
  function createTone(freq,duration,type='sine',volume=0.3){
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type=type;
    osc.frequency.value=freq;
    gain.gain.setValueAtTime(volume,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime+duration);
  }
  function shouldPlay(){return localStorage.getItem('sound')!=='off'}
  SOUNDS.send=()=>{if(shouldPlay())createTone(800,0.1,'sine',0.2)};
  SOUNDS.receive=()=>{if(shouldPlay()){createTone(600,0.08,'sine',0.15);setTimeout(()=>createTone(800,0.08,'sine',0.15),80)}};
  SOUNDS.notification=()=>{if(shouldPlay()){createTone(523,0.15,'sine',0.2);setTimeout(()=>createTone(659,0.15,'sine',0.2),150);setTimeout(()=>createTone(784,0.2,'sine',0.2),300)}};
}
document.addEventListener('DOMContentLoaded',initSounds);

// ===== EMOJI LIST =====
// ===== SERVICE WORKER =====
if('serviceWorker'in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}

const EMOJIS=['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','💀','☠️','👻','👽','👾','🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🫵','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄','💋','🩸','🧑','👨','👩','🧓','👴','👵','👶','🧒','👦','👧','🧑‍🦱','👨‍🦱','👩‍🦱','🧑‍🦰','👨‍🦰','👩‍🦰','🧑‍🦳','👨‍🦳','👩‍🦳','🧑‍🦲','👨‍🦲','👩‍🦲','🧑‍⚕️','👨‍⚕️','👩‍⚕️','🧑‍🎓','👨‍🎓','👩‍🎓','🧑‍🏫','👨‍🏫','👩‍🏫','🧑‍⚖️','👨‍⚖️','👩‍⚖️','🧑‍🌾','👨‍🌾','👩‍🌾','🧑‍🍳','👨‍🍳','👩‍🍳','🧑‍🔧','👨‍🔧','👩‍🔧','🧑‍🏭','👨‍🏭','👩‍🏭','🧑‍💼','👨‍💼','👩‍💼','🧑‍🔬','👨‍🔬','👩‍🔬','🧑‍💻','👨‍💻','👩‍💻','🧑‍🎤','👨‍🎤','👩‍🎤','🧑‍🎨','👨‍🎨','👩‍🎨','🧑‍✈️','👨‍✈️','👩‍✈️','🧑‍🚀','👨‍🚀','👩‍🚀','🧑‍🚒','👨‍🚒','👩‍🚒','👮','👮‍♂️','👮‍♀️','🕵️','🕵️‍♂️','🕵️‍♀️','💂','💂‍♂️','💂‍♀️','🥷','👷','👷‍♂️','👷‍♀️','🤴','👸','👳','👳‍♂️','👳‍♀️','👲','🧕','🤵','🤵‍♂️','🤵‍♀️','👰','👰‍♂️','👰‍♀️','🤰','🫃','🫄','🤱','👩‍🍼','👨‍🍼','🧑‍🍼','👼','🎅','🤶','🧑‍🎄','🦸','🦸‍♂️','🦸‍♀️','🦹','🦹‍♂️','🦹‍♀️','🧙','🧙‍♂️','🧙‍♀️','🧚','🧚‍♂️','🧚‍♀️','🧛','🧛‍♂️','🧛‍♀️','🧜','🧜‍♂️','🧜‍♀️','🧝','🧝‍♂️','🧝‍♀️','🧞','🧞‍♂️','🧞‍♀️','🧟','🧟‍♂️','🧟‍♀️','💆','💆‍♂️','💆‍♀️','💇','💇‍♂️','💇‍♀️','🚶','🚶‍♂️','🚶‍♀️','🧍','🧍‍♂️','🧍‍♀️','🧎','🧎‍♂️','🧎‍♀️','🏃','🏃‍♂️','🏃‍♀️','💃','🕺','🕴','👯','👯‍♂️','👯‍♀️','🧖','🧖‍♂️','🧖‍♀️','🧗','🧗‍♂️','🧗‍♀️','🤸','🤸‍♂️','🤸‍♀️','⛹️','⛹️‍♂️','⛹️‍♀️','🏋️','🏋️‍♂️','🏋️‍♀️','🚴','🚴‍♂️','🚴‍♀️','🚵','🚵‍♂️','🚵‍♀️','🤼','🤼‍♂️','🤼‍♀️','🤽','🤽‍♂️','🤽‍♀️','🤾','🤾‍♂️','🤾‍♀️','🤺','🏇','⛷','🏂','🏄','🏄‍♂️','🏄‍♀️','🚣','🚣‍♂️','🚣‍♀️','🏊','🏊‍♂️','🏊‍♀️','🤿','🧘','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈️','♉️','♊️','♋️','♌️','♍️','♎️','♏️','♐️','♑️','♒️','♓️','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚️','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕️','🛑','⛔️','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗️','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯️','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿️','🅿️','🈳','🈂️','🛂','🛃','🛄','🛅','🪪','⚠️','🚸','⬆️','⬇️','➡️','⬅️','🔙','🔚','🔛','🔜','🔝','🛐','⚕️','♻️','⚧️','🏳️','🏴','🏁','🚩','🎌','🏴‍☠️','🇺🇳','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇯🇵','🇰🇷','🇨🇳','🇮🇳','🇩🇪','🇫🇷','🇪🇸','🇮🇹','🇷🇺','🇧🇷','🇦🇪','🇿🇦','🇸🇦','🇹🇷','🇵🇰','🇧🇩','🇲🇾','🇸🇬','🇵🇭','🇮🇩','🇹🇭','🇻🇳','🇳🇬','🇰🇪','🇪🇬','🇲🇦','🇩🇿','🇦🇷','🇨🇱','🇵🇪','🇨🇴','🇻🇪','🇺🇦','🇵🇱','🇳🇱','🇧🇪','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇨🇿','🇵🇹','🇬🇷','🇭🇺','🇷🇴','🇦🇹','🇨🇭','🇭🇰','🇹🇼','🇲🇽','🇮🇱'];
