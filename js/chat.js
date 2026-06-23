let currentChatId = null;
let currentChatPartner = null;
let messageListener = null;
let typingListener = null;
let chatListListener = null;
let replyToMessage = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadChatList();
});

function loadChatList() {
  const chatList = document.getElementById('chatList');
  const emptyChats = document.getElementById('emptyChats');

  if (chatListListener) removeListener(chatListListener);

  chatListListener = database.ref('chats').orderByChild(`participants/${currentUserId}`).equalTo(true);
  chatListListener.on('value', (snapshot) => {
    const chats = [];
    snapshot.forEach((child) => {
      const chat = child.val();
      chat.id = child.key;
      if (chat.lastMessage) {
        chats.push(chat);
      }
    });

    chats.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));

    if (chats.length === 0) {
      chatList.innerHTML = '';
      emptyChats.style.display = 'flex';
      return;
    }

    emptyChats.style.display = 'none';
    chatList.innerHTML = chats.map(chat => {
      const partnerId = Object.keys(chat.participants || {}).find(id => id !== currentUserId);
      const isOnline = chat.participantStatus?.[partnerId]?.online;
      const unread = chat.unread?.[currentUserId] || 0;
      return `
        <div class="chat-item" onclick="openConversation('${chat.id}', '${partnerId}')">
          <div class="chat-item-avatar">
            <img src="${chat.participantData?.[partnerId]?.avatar || '../assets/images/default-avatar.png'}" alt="" onerror="this.src='../assets/images/default-avatar.png'">
            <span class="online-dot ${isOnline ? '' : 'offline'}"></span>
          </div>
          <div class="chat-item-info">
            <div class="chat-item-name">
              ${sanitizeHtml(chat.participantData?.[partnerId]?.fullName || chat.participantData?.[partnerId]?.username || 'Unknown')}
              ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
            </div>
            <div class="chat-item-last">${sanitizeHtml(chat.lastMessage?.text || (chat.lastMessage?.hasImage ? 'Photo' : ''))}</div>
          </div>
          <div class="chat-item-meta">
            <div class="chat-item-time">${formatTime(chat.lastMessage?.timestamp)}</div>
          </div>
        </div>
      `;
    }).join('');
  });
}

async function openConversation(chatId, partnerId) {
  currentChatId = chatId;
  currentChatPartner = partnerId;

  const partnerData = await getUserData(partnerId);
  if (!partnerData) return;

  document.getElementById('convAvatar').src = partnerData.avatar || '../assets/images/default-avatar.png';
  document.getElementById('convName').textContent = partnerData.fullName || partnerData.username;
  updatePartnerStatus(partnerData);

  document.getElementById('chatListView').classList.remove('active');
  document.getElementById('conversationView').classList.add('active');

  clearUnread(chatId);
  loadMessages(chatId);
  listenTyping(chatId, partnerId);

  database.ref(`chats/${chatId}/participantStatus/${partnerId}`).on('value', (s) => {
    const status = s.val();
    if (status) {
      updatePartnerStatus(status);
    }
  });
}

function updatePartnerStatus(data) {
  const isOnline = data.online === true;
  const dot = document.getElementById('convOnlineStatus');
  const status = document.getElementById('convStatus');

  dot.className = `online-dot ${isOnline ? '' : 'offline'}`;
  if (isOnline) {
    status.textContent = 'Online';
  } else {
    status.textContent = `Last seen ${formatLastSeen(data.lastSeen)}`;
  }
}

function closeConversation() {
  currentChatId = null;
  currentChatPartner = null;
  replyToMessage = null;

  if (messageListener) removeListener(messageListener);
  if (typingListener) removeListener(typingListener);

  document.getElementById('conversationView').classList.remove('active');
  document.getElementById('chatListView').classList.add('active');
  document.getElementById('messagesList').innerHTML = '';
  document.getElementById('typingIndicator').style.display = 'none';
}

function loadMessages(chatId) {
  if (messageListener) removeListener(messageListener);

  const messagesContainer = document.getElementById('messagesContainer');
  const messagesList = document.getElementById('messagesList');
  messagesList.innerHTML = '';

  messageListener = database.ref(`chats/${chatId}/messages`).orderByChild('timestamp').limitToLast(100);
  messageListener.on('child_added', (snapshot) => {
    const msg = snapshot.val();
    msg.id = snapshot.key;
    appendMessage(msg, chatId);

    if (msg.senderId !== currentUserId) {
      markMessageSeen(chatId, msg.id);
    }
  });

  messageListener.on('child_changed', (snapshot) => {
    const msg = snapshot.val();
    msg.id = snapshot.key;
    updateMessageStatus(msg.id, msg.status);
  });
}

function appendMessage(msg, chatId) {
  const messagesList = document.getElementById('messagesList');
  const isSent = msg.senderId === currentUserId;

  const existing = document.getElementById(`msg-${msg.id}`);
  if (existing) return;

  const div = document.createElement('div');
  div.id = `msg-${msg.id}`;
  div.className = `message ${isSent ? 'sent' : 'received'}`;

  let html = '';

  if (msg.replyTo) {
    html += `<div class="reply-context">${sanitizeHtml(msg.replyTo.text || 'Photo')}</div>`;
  }

  if (msg.imageUrl) {
    html += `<img src="${msg.imageUrl}" class="message-image" onclick="openImagePreview('${msg.imageUrl}')" alt="photo" loading="lazy">`;
  }

  if (msg.text) {
    html += `<div class="message-text">${sanitizeHtml(msg.text)}</div>`;
  }

  const statusIcon = isSent ? getStatusIcon(msg.status) : '';
  html += `
    <div class="message-meta">
      <span class="message-time">${formatTime(msg.timestamp)}</span>
      ${statusIcon ? `<span class="message-status ${msg.status === 'seen' ? 'seen' : ''}">${statusIcon}</span>` : ''}
    </div>
  `;

  div.innerHTML = html;
  messagesList.appendChild(div);

  scrollToBottom();
}

function getStatusIcon(status) {
  if (status === 'sent') return '<i class="fas fa-check" style="font-size:0.65rem"></i>';
  if (status === 'delivered') return '<i class="fas fa-check-double" style="font-size:0.65rem"></i>';
  if (status === 'seen') return '<i class="fas fa-check-double" style="font-size:0.65rem;color:#4fc3f7"></i>';
  return '';
}

function updateMessageStatus(messageId, status) {
  const el = document.getElementById(`msg-${messageId}`);
  if (!el) return;
  const statusEl = el.querySelector('.message-status');
  if (statusEl) {
    statusEl.innerHTML = getStatusIcon(status);
    statusEl.className = `message-status ${status === 'seen' ? 'seen' : ''}`;
  }
}

function markMessageSeen(chatId, messageId) {
  database.ref(`chats/${chatId}/messages/${messageId}/status`).once('value', (s) => {
    const currentStatus = s.val();
    if (currentStatus !== 'seen') {
      database.ref(`chats/${chatId}/messages/${messageId}/status`).set('seen');
    }
  });
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  const imageInput = document.getElementById('imageInput');
  const file = imageInput.files[0];

  if (!text && !file) return;
  if (!currentChatId || !currentChatPartner) return;

  const messageId = generateId();
  const messageData = {
    id: messageId,
    senderId: currentUserId,
    text: text || '',
    timestamp: Date.now(),
    status: 'sent',
    replyTo: replyToMessage ? {
      text: replyToMessage.text,
      senderId: replyToMessage.senderId
    } : null
  };

  if (file) {
    try {
      const imgUrl = await uploadChatImage(file, currentChatId);
      messageData.imageUrl = imgUrl;
      messageData.hasImage = true;
    } catch (error) {
      showToast('Failed to upload image', 'error');
      return;
    }
  }

  input.value = '';
  input.style.height = 'auto';
  imageInput.value = '';
  replyToMessage = null;
  document.getElementById('replyPreview').style.display = 'none';

  const updates = {};
  updates[`chats/${currentChatId}/messages/${messageId}`] = messageData;
  updates[`chats/${currentChatId}/lastMessage`] = {
    text: text || 'Photo',
    senderId: currentUserId,
    timestamp: Date.now(),
    hasImage: !!file
  };
  updates[`chats/${currentChatId}/unread/${currentChatPartner}`] = database.increment ? firebase.database.ServerValue.increment(1) : 1;

  try {
    await database.ref().update(updates);
    await database.ref(`chats/${currentChatId}/messages/${messageId}/status`).set('sent');

    setTimeout(async () => {
      await database.ref(`chats/${currentChatId}/messages/${messageId}/status`).set('delivered');
    }, 500);

    const partnerData = await getUserData(currentChatPartner);
    if (partnerData && partnerData.fcmToken) {
      try {
        await sendPushNotification(currentChatPartner, 'New Message',
          `${currentUser.fullName || currentUser.username}: ${text || 'Photo'}`,
          { chatId: currentChatId, senderId: currentUserId }
        );
      } catch (e) {}
    }
  } catch (error) {
    showToast('Failed to send message', 'error');
  }

  stopTyping();
}

function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function clearUnread(chatId) {
  database.ref(`chats/${chatId}/unread/${currentUserId}`).remove();
}

async function startChatWith(userId, username, fullName, avatar) {
  closeSearchModal();

  const existingChat = await findExistingChat(userId);
  if (existingChat) {
    openConversation(existingChat, userId);
    return;
  }

  const chatId = generateId();
  const chatData = {
    participants: {
      [currentUserId]: true,
      [userId]: true
    },
    participantStatus: {
      [currentUserId]: { online: true },
      [userId]: { online: false }
    },
    participantData: {
      [currentUserId]: {
        username: currentUser.username,
        fullName: localStorage.getItem('seven_name'),
        avatar: ''
      },
      [userId]: {
        username: username,
        fullName: fullName,
        avatar: avatar
      }
    },
    createdAt: Date.now()
  };

  try {
    await database.ref(`chats/${chatId}`).set(chatData);
    openConversation(chatId, userId);
  } catch (error) {
    showToast('Failed to create chat', 'error');
  }
}

function findExistingChat(userId) {
  return new Promise((resolve) => {
    database.ref('chats').orderByChild(`participants/${currentUserId}`).equalTo(true).once('value', (snapshot) => {
      let found = null;
      snapshot.forEach((child) => {
        const chat = child.val();
        if (chat.participants && chat.participants[userId]) {
          found = child.key;
          return true;
        }
      });
      resolve(found);
    });
  });
}

function handleTyping() {
  if (!currentChatId) return;
  database.ref(`chats/${currentChatId}/typing/${currentUserId}`).set({
    isTyping: true,
    timestamp: Date.now()
  });

  clearTimeout(window._typingTimeout);
  window._typingTimeout = setTimeout(() => stopTyping(), 2000);
}

function stopTyping() {
  if (!currentChatId) return;
  database.ref(`chats/${currentChatId}/typing/${currentUserId}`).remove();
}

function listenTyping(chatId, partnerId) {
  if (typingListener) removeListener(typingListener);

  typingListener = database.ref(`chats/${chatId}/typing/${partnerId}`);
  typingListener.on('value', (snapshot) => {
    const data = snapshot.val();
    const indicator = document.getElementById('typingIndicator');
    const typingText = document.getElementById('typingText');
    if (data && data.isTyping) {
      indicator.style.display = 'flex';
      typingText.textContent = 'typing...';
    } else {
      indicator.style.display = 'none';
    }
  });
}

async function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image must be less than 5MB', 'error');
    return;
  }

  showToast('Uploading image...', 'info');
  await sendMessage();
}

function openImagePreview(url) {
  const modal = document.getElementById('imagePreviewModal');
  const img = document.getElementById('fullscreenImage');
  img.src = url;
  modal.style.display = 'flex';
}

function closeImagePreview(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('imagePreviewModal').style.display = 'none';
}

function downloadImage() {
  const url = document.getElementById('fullscreenImage').src;
  const a = document.createElement('a');
  a.href = url;
  a.download = 'image.jpg';
  a.click();
}

function setReply(messageId, text, senderId) {
  replyToMessage = { id: messageId, text, senderId };
  const preview = document.getElementById('replyPreview');
  const replyText = document.getElementById('replyText');
  preview.style.display = 'flex';
  replyText.textContent = text || 'Photo';
}

function cancelReply() {
  replyToMessage = null;
  document.getElementById('replyPreview').style.display = 'none';
}

function showUserProfile() {
  if (!currentChatPartner) return;
  const modal = document.getElementById('userProfileModal');

  getUserData(currentChatPartner).then((data) => {
    if (!data) return;
    document.getElementById('userProfileAvatar').src = data.avatar || '../assets/images/default-avatar.png';
    document.getElementById('userProfileName').textContent = data.fullName || data.username;
    document.getElementById('userProfileUsername').textContent = data.username;
    document.getElementById('userProfileOnline').style.display = data.online ? 'inline-flex' : 'none';
    document.getElementById('userProfileOffline').style.display = data.online ? 'none' : 'inline-flex';
    document.getElementById('userProfileLastSeen').textContent = formatLastSeen(data.lastSeen);
    modal.style.display = 'flex';
  });
}

function closeUserProfile(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('userProfileModal').style.display = 'none';
}

function navigateToProfile() {
  window.location.href = 'pages/profile.html';
}
