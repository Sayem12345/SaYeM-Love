function searchUsers(q){
  return new Promise(r=>{
    if(!q||q.length<1){r([]);return}
    database.ref('users').orderByChild('username')
      .startAt(q.toLowerCase()).endAt(q.toLowerCase()+'\uf8ff')
      .limitToFirst(20).once('value',s=>{
        const res=[];
        s.forEach(c=>{const u=c.val();if(u.id!==currentUserId)res.push({id:c.key,...u})});
        r(res);
      });
  });
}

const doSearch=debounce(async q=>{
  const box=document.getElementById('searchResults');
  if(!q||q.length<1){box.innerHTML='';return}
  try{
    const res=await searchUsers(q);
    if(res.length===0){box.innerHTML='<div class="empty-state" style="padding:1rem"><p>No users found</p></div>';return}
    box.innerHTML=res.map(u=>`
      <div class="sr-item" onclick="startChat('${u.id}','${esc(u.username)}','${esc(u.fullName||u.username)}','${u.avatar||''}')">
        <img src="${u.avatar||'assets/images/default-avatar.svg'}" alt="" onerror="this.src='assets/images/default-avatar.svg'">
        <div class="sr-info">
          <div class="sr-name">${esc(u.fullName||u.username)}</div>
          <div class="sr-uname">@${esc(u.username)}</div>
        </div>
        <i class="fas fa-comment" style="color:var(--text3)"></i>
      </div>
    `).join('');
  }catch(e){box.innerHTML='<div class="empty-state" style="padding:1rem"><p>Search failed</p></div>'}
},400);

function openSearch(){
  document.getElementById('searchModal').style.display='flex';
  document.getElementById('searchInput').value='';
  document.getElementById('searchResults').innerHTML='';
  setTimeout(()=>document.getElementById('searchInput').focus(),100);
}

function closeSearch(){
  document.getElementById('searchModal').style.display='none';
}
