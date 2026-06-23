if('serviceWorker'in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      reg.addEventListener('updatefound',()=>{
        const nw=reg.installing;
        nw.addEventListener('statechange',()=>{
          if(nw.state==='installed'&&navigator.serviceWorker.controller)showUpdate();
        });
      });
    }).catch(e=>console.log('SW error:',e));
  });
}

function showUpdate(){
  const t=document.querySelector('.toast')||document.createElement('div');
  t.className='toast';
  t.innerHTML='New version! <button onclick="refreshApp()" style="background:var(--accent);color:#fff;border:none;padding:4px 12px;border-radius:12px;margin-left:8px;cursor:pointer">Update</button>';
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
}

function refreshApp(){
  navigator.serviceWorker.getRegistration().then(r=>{if(r){r.waiting.postMessage({type:'SKIP_WAITING'});location.reload()}});
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  const d=document.getElementById('installPrompt')||createInstallPrompt();
  d.style.display='flex';
  d.querySelector('.install-btn').addEventListener('click',async()=>{
    deferredPrompt.prompt();
    const r=await deferredPrompt.userChoice;
    if(r.outcome==='accepted')d.style.display='none';
    deferredPrompt=null;
  });
  d.querySelector('.install-close').addEventListener('click',()=>{d.style.display='none';localStorage.setItem('seven_install_dismissed',Date.now().toString())});
});

function createInstallPrompt(){
  const d=document.createElement('div');d.id='installPrompt';
  d.style.cssText='position:fixed;bottom:1rem;left:1rem;right:1rem;background:var(--glass);backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:var(--radius2);padding:1rem;z-index:1000;display:none;align-items:center;gap:.8rem';
  d.innerHTML='<i class="fas fa-heart" style="font-size:1.5rem;color:var(--accent)"></i><div style="flex:1"><strong>Install SEVEN</strong><p style="font-size:.8rem;color:var(--text2)">Add to home screen</p></div><button class="install-btn" style="background:var(--grad);color:#fff;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-weight:600">Install</button><button class="install-close" style="background:transparent;color:var(--text3);border:none;font-size:1.2rem;cursor:pointer">&times;</button>';
  document.body.appendChild(d);
  return d;
}

window.addEventListener('appinstalled',()=>{const d=document.getElementById('installPrompt');if(d)d.style.display='none';toast('App installed!','ok')});
