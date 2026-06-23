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

// ===== SPA ROUTER =====
const _scrollStates={};
const _spaPages=['home.html','chat.html','search.html','active.html','profile.html','settings.html'];
function goTo(page){
  if(page.includes('login')||page.includes('registration')){window.location.href=page;return}
  const pn=page.includes('?')?page.split('?')[0]:page.endsWith('.html')?page:page+'.html';
  if(!_spaPages.includes(pn)){window.location.href=page;return}
  if(pn!=='home.html')_inSubPage=true;
  _saveScrollState();
  history.pushState({page,dir:'forward'},'',page);
  _loadPage(pn,page);
}
function _loadPage(pn,fullUrl){
  _showLoading(true);
  const url=fullUrl||pn;
  fetch(pn).then(r=>r.text()).then(html=>{
    const d=new DOMParser().parseFromString(html,'text/html');
    const app=document.getElementById('app');
    if(!app){window.location.href=url;return}
    app.innerHTML=d.body.innerHTML;
    _execScripts(app);
    _initCurPage(pn);
    setTimeout(()=>_showLoading(false),120);
  }).catch(()=>{window.location.href=url});
}
function _execScripts(c){
  c.querySelectorAll('script').forEach(old=>{
    const s=document.createElement('script');
    if(old.src){if(!document.querySelector(`script[src="${old.src}"]`)){s.src=old.src;s.async=false;document.head.appendChild(s)}}else{s.textContent=old.textContent;old.parentNode.replaceChild(s,old)}
  });
}
function _saveScrollState(){
  const p=window.location.pathname.split('/').pop()+window.location.search;
  const el=document.querySelector('.msg-container')||document.querySelector('.chat-list')||document.querySelector('.tab-content.active')||document.querySelector('#profileTabContent')||document.querySelector('.settings-tab')||document.querySelector('#searchResults')||document.querySelector('#activeUsers');
  if(el)_scrollStates[p]=el.scrollTop;
}
function _restoreScrollState(){
  setTimeout(()=>{
    const p=window.location.pathname.split('/').pop()+window.location.search;
    const el=document.querySelector('.msg-container')||document.querySelector('.chat-list')||document.querySelector('.tab-content.active')||document.querySelector('#profileTabContent')||document.querySelector('.settings-tab')||document.querySelector('#searchResults')||document.querySelector('#activeUsers');
    if(el&&_scrollStates[p]!==undefined)el.scrollTop=_scrollStates[p];
  },50);
}
function _initCurPage(pn){
  if(pn==='chat.html'&&typeof initChat==='function')initChat();
  else if(pn==='search.html'&&typeof initSearch==='function')initSearch();
  else if(pn==='active.html'&&typeof initActive==='function')initActive();
  else if(pn==='profile.html'&&typeof initProfile==='function')initProfile();
  else if(pn==='settings.html'&&typeof initSettings==='function')initSettings();
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
async function ghUpload(path,blob,msg,onProgress){
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
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('PUT',u);
    xhr.setRequestHeader('Authorization','Bearer '+GH.token);
    xhr.setRequestHeader('Accept','application/vnd.github+json');
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.upload.onprogress=e=>{if(onProgress&&e.lengthComputable)onProgress(e.loaded,e.total)};
    xhr.onload=()=>{
      if(xhr.status>=200&&xhr.status<300)resolve(GH.raw+'/'+path);
      else reject(new Error('Upload failed: '+xhr.status));
    };
    xhr.onerror=()=>reject(new Error('Upload failed'));
    xhr.send(JSON.stringify(body));
  });
}

function blobToBase64(blob){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=rej;
    r.readAsDataURL(blob)
  })
}

// ===== PROFILE =====
async function updateProfile(data){
  const myId=uid();
  if(!myId)return;
  try{await REFS.users.child(myId).update(data);toast('Profile updated','success')}
  catch(e){toast('Update failed','error')}
}
async function updateProfileImage(blob,onProgress){
  const myId=uid();
  if(!myId||!blob)return null;
  try{
    const url=await ghUpload('uploads/profiles/'+myId+'.jpg',blob,'Profile update',onProgress);
    if(url)await REFS.users.child(myId).update({profileImage:url});
    toast('Photo updated','success');
    return url;
  }catch(e){toast('Upload failed','error');return null}
}

// ===== SOUNDS =====
const SOUNDS={};
let _sndCtx=null;
function getSndCtx(){
  if(!_sndCtx)_sndCtx=new(window.AudioContext||window.webkitAudioContext);
  if(_sndCtx.state==='suspended')_sndCtx.resume();
  return _sndCtx;
}
function playTone(freq,dur,type='sine',vol=0.3,delay=0){
  try{
    const ctx=getSndCtx();
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,ctx.currentTime+delay);
    gain.gain.setValueAtTime(vol,ctx.currentTime+delay);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+delay+dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime+delay);
    osc.stop(ctx.currentTime+delay+dur);
  }catch(e){}
}
function playSfx(notes){
  notes.forEach(n=>playTone(n[0],n[1],n[2]||'sine',n[3]||0.25,n[4]||0));
}
function shouldPlay(){return localStorage.getItem('sound')!=='off'}
SOUNDS.send=()=>{
  if(!shouldPlay())return;
  playSfx([[600,0.04,'sine',0.15],[900,0.06,'sine',0.12,0.04]]);
};
SOUNDS.receive=()=>{
  if(!shouldPlay())return;
  playSfx([[523,0.06,'sine',0.15,0],[659,0.08,'sine',0.15,0.06],[784,0.1,'sine',0.12,0.12]]);
};
SOUNDS.notification=()=>{
  if(!shouldPlay())return;
  playSfx([[440,0.12,'triangle',0.2,0],[660,0.12,'triangle',0.2,0.12],[880,0.15,'triangle',0.15,0.24]]);
};
// ===== ANDROID BACK BUTTON + EXIT MODAL =====
let _inSubPage=false;

function showExitModal(){
  const m=document.getElementById('exitModal');
  if(m){m.classList.add('active');return}
  const ov=document.createElement('div');ov.id='exitModal';ov.className='modal-overlay exit-modal-overlay';
  ov.innerHTML='<div class="exit-modal"><div class="exit-icon"><i class="fa-solid fa-right-from-bracket"></i></div><div class="exit-title">Leave SEVEN?</div><div class="exit-desc">Are you sure you want to close the app?</div><div class="exit-actions"><button class="btn btn-ghost btn-lg btn-full" onclick="hideExitModal()">Cancel</button><button class="btn btn-danger btn-lg btn-full" onclick="exitApp()"><i class="fa-solid fa-door-open"></i> Exit</button></div></div>';
  ov.onclick=e=>{if(e.target===ov)hideExitModal()};
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('active'));
}
function hideExitModal(){
  const m=document.getElementById('exitModal');
  if(m)m.classList.remove('active');
}
function exitApp(){
  try{if(navigator.app&&navigator.app.exitApp)navigator.app.exitApp()}catch(e){}
  window.close();
}

function initAndroidBack(){
  if(!history.state||!history.state._seven&&!history.state.page){
    history.replaceState({_seven:true,page:'home.html'},'');
  }
  window.addEventListener('popstate',e=>{
    const state=e.state;
    if(_inSubPage){
      _inSubPage=false;
      if(state&&state.page){
        _loadPage(state.page.includes('?')?state.page.split('?')[0]:state.page,state.page);
        return;
      }
      _loadPage('home.html','home.html');
      return;
    }
    const page=window.location.pathname.split('/').pop();
    if(!page||page==='home.html'||page==='index.html'||page===''){
      showExitModal();
      history.pushState({_seven:true,page:'home.html'},'');
    }else{
      goTo('home.html');
    }
  });
}

// ===== RIPPLE EFFECT =====
function initRipple(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.btn,.topbar-btn,.chat-action-btn,.chat-send,.bottom-tab,.fab,.settings-row,.chat-item,.user-row,.forward-user,.search-filter,.profile-field-edit,.reply-bar-cancel');
    if(!btn)return;
    const r=document.createElement('span');
    r.className='ripple';
    const rect=btn.getBoundingClientRect();
    const size=Math.max(rect.width,rect.height);
    r.style.width=r.style.height=size+'px';
    r.style.left=(e.clientX-rect.left-size/2)+'px';
    r.style.top=(e.clientY-rect.top-size/2)+'px';
    btn.appendChild(r);
    r.addEventListener('animationend',()=>r.remove());
  });
}

// ===== LOADING OVERLAY =====
function _showLoading(show){
  let ov=document.getElementById('pageLoader');
  if(!ov&&show){
    ov=document.createElement('div');ov.id='pageLoader';ov.className='page-loader';
    ov.innerHTML='<div class="spinner"></div>';
    document.body.appendChild(ov);
    requestAnimationFrame(()=>ov.classList.add('show'));
  }else if(ov&&!show){
    ov.classList.remove('show');
    setTimeout(()=>{if(ov&&ov.parentNode)ov.remove()},300);
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  initAndroidBack();
  initRipple();
});

// ===== SERVICE WORKER =====
if('serviceWorker'in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
    navigator.serviceWorker.register('firebase-messaging-sw.js').catch(()=>{});
  });
}
