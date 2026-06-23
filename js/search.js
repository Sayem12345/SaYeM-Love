async function searchUsers(query) {
  if (!query || query.length < 1) return [];
  return new Promise((resolve) => {
    database.ref('users').orderByChild('username')
      .startAt(query.toLowerCase())
      .endAt(query.toLowerCase() + '\uf8ff')
      .limitToFirst(20)
      .once('value', (snapshot) => {
        const results = [];
        snapshot.forEach((child) => {
          const user = child.val();
          if (user.id !== currentUserId) {
            results.push({ id: child.key, ...user });
          }
        });
        resolve(results);
      });
  });
}

const debounceSearch = debounce(async (query) => {
  const resultsContainer = document.getElementById('searchResults');
  if (!query || query.length < 1) {
    resultsContainer.innerHTML = '';
    return;
  }

  try {
    const results = await searchUsers(query);
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="empty-state" style="padding:1rem"><p style="font-size:0.9rem">No users found</p></div>';
      return;
    }

    resultsContainer.innerHTML = results.map(user => `
      <div class="search-result-item" onclick="startChatWith('${user.id}', '${sanitizeHtml(user.username)}', '${sanitizeHtml(user.fullName || user.username)}', '${user.avatar || ''}')">
        <img src="${user.avatar || '../assets/images/default-avatar.png'}" alt="" onerror="this.src='../assets/images/default-avatar.png'">
        <div class="search-result-info">
          <div class="search-result-name">${sanitizeHtml(user.fullName || user.username)}</div>
          <div class="search-result-username">@${sanitizeHtml(user.username)}</div>
        </div>
        <i class="fas fa-comment" style="color:var(--text-muted)"></i>
      </div>
    `).join('');
  } catch (error) {
    resultsContainer.innerHTML = '<div class="empty-state" style="padding:1rem"><p>Search failed</p></div>';
  }
}, 400);

function showSearchModal() {
  document.getElementById('searchModal').style.display = 'flex';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
  setTimeout(() => document.getElementById('searchInput').focus(), 100);
}

function closeSearchModal(event) {
  if (event && event.target !== event.currentTarget && event.target.closest('.modal-content')) return;
  document.getElementById('searchModal').style.display = 'none';
}
