let currentUser = null;
let currentUserId = null;
let activeRefs = [];

function fmtTime(ts){
  if(!ts) return '';
  const d = new Date(ts), n = new Date();
  const diff = n - d;
  if(diff < 60000) return 'now';
  if(diff < 3600000) return Math.floor(diff/60000)+'m';
  if(diff < 86400000) return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  if(diff < 172800000) return 'Yesterday';
  if(diff < 604800000) return d.toLocaleDateString([],{weekday:'short'});
  return d.toLocaleDateString([],{day:'numeric',month:'short'});
}

function fmtLast(ts){
  if(!ts) return 'unknown';
  const d = new Date(ts), n = new Date();
  const diff = n - d;
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), dd = Math.floor(diff/86400000);
  if(m<1) return 'just now';
  if(m<60) return m+'m ago';
  if(h<24) return h+'h ago';
  if(dd<7) return dd+'d ago';
  return fmtTime(ts);
}

function uid(){return database.ref().push().key}

function esc(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML}

function toast(msg, type=''){
  let el = document.querySelector('.toast');
  if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el)}
  el.textContent=msg;
  el.className='toast '+(type||'');
  requestAnimationFrame(()=>el.classList.add('show'));
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),3000);
}

function toggleField(id,btn){
  const inp=document.getElementById(id);if(!inp)return;
  const is=inp.type==='password';
  inp.type=is?'text':'password';
  btn.querySelector('i').className=is?'fas fa-eye-slash':'fas fa-eye';
}

function debounce(fn,ms=300){
  let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms)}
}

function autoHeight(el){
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,120)+'px';
}

function btnLoad(btn,l){
  const t=btn.querySelector('.btn-text'),ld=btn.querySelector('.btn-load');
  if(t)t.style.display=l?'none':'inline';
  if(ld)ld.style.display=l?'inline-flex':'none';
  btn.disabled=l;
}

function offRef(r){
  r.off();
  const i=activeRefs.indexOf(r);
  if(i>-1)activeRefs.splice(i,1);
}

function clearRefs(){activeRefs.forEach(r=>r.off());activeRefs=[]}

function compressImg(file,mw=800,q=.7){
  return new Promise(r=>{
    const rd=new FileReader();
    rd.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const c=document.createElement('canvas');
        let w=img.width,h=img.height;
        if(w>mw){h=(mw/w)*h;w=mw}
        c.width=w;c.height=h;
        const ctx=c.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        c.toBlob(b=>r(b),'image/jpeg',q);
      };
      img.src=e.target.result;
    };
    rd.readAsDataURL(file);
  });
}
