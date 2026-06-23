async function uploadToGitHub(file, path) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Content = e.target.result.split(',')[1];
        const content = await compressImage(file);
        const compressedBase64 = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result.split(',')[1]);
          r.readAsDataURL(content);
        });

        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        const token = typeof GITHUB_TOKEN !== 'undefined' ? GITHUB_TOKEN : '';
        if (!token) throw new Error('GitHub token not configured. Copy js/github-token.example.js to js/github-token.js and add your token.');
        const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Upload ${fileName}`,
            content: compressedBase64,
            branch: GITHUB_CONFIG.branch
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Upload failed');
        }

        const data = await response.json();
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${filePath}`;
        resolve(rawUrl);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function uploadProfileImage(file) {
  if (!currentUserId) throw new Error('Not authenticated');
  const url = await uploadToGitHub(file, `avatars/${currentUserId}`);
  await database.ref(`users/${currentUserId}/avatar`).set(url);
  return url;
}

async function uploadChatImage(file, chatId) {
  return await uploadToGitHub(file, `chats/${chatId}`);
}
