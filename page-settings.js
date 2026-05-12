/* ===== settings.html 页面逻辑 ===== */
(function() {
  if (!getToken()) { alert('请先登录'); window.location.href = 'index.html'; return; }

  var playerSelect = document.getElementById('s_favPlayer');
  PLAYERS.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name + '（' + p.gameId.split('/')[0].trim() + '）';
    playerSelect.appendChild(opt);
  });

  var teamSelect = document.getElementById('s_favTeam');
  ['兴欣','嘉世','霸图','蓝雨','微草','轮回','雷霆','烟雨','虚空','呼啸','三零一','义斩'].forEach(function(t) {
    var opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    teamSelect.appendChild(opt);
  });

  var pendingAvatar = null;
  var existingAvatar = '';

  (function fillFromCache() {
    var cached = getUser();
    if (!cached) return;
    if (cached.username) document.getElementById('s_name').value = cached.username;
    if (cached.bio) document.getElementById('s_bio').value = cached.bio;
    if (cached.avatar) {
      existingAvatar = cached.avatar;
      document.querySelector('#avatarPreview img').src = cached.avatar;
      document.getElementById('avatarPreview').style.display = 'block';
    }
  })();

  async function loadSettings() {
    try {
      var profile = await apiGet('/api/profile');
      if (!profile) return;
      var cached = getUser() || {};
      cached.username = profile.username || cached.username;
      cached.bio = profile.bio || cached.bio;
      cached.avatar = profile.avatar || cached.avatar;
      localStorage.setItem('glory_user', JSON.stringify(cached));

      if (profile.username) document.getElementById('s_name').value = profile.username;
      if (profile.bio) document.getElementById('s_bio').value = profile.bio;
      if (profile.favPlayer) document.getElementById('s_favPlayer').value = profile.favPlayer;
      if (profile.favTeam) document.getElementById('s_favTeam').value = profile.favTeam;
      if (profile.avatar) {
        existingAvatar = profile.avatar;
        document.querySelector('#avatarPreview img').src = profile.avatar;
        document.getElementById('avatarPreview').style.display = 'block';
      }
    } catch(e) {
      console.error('loadSettings error:', e);
    }
  }

  window.previewAvatar = function(input) {
    var file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('请选择图片文件'); input.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { alert('图片过大，请选择 10MB 以内'); input.value = ''; return; }

    var reader = new FileReader();
    reader.onload = function(e) {
      document.querySelector('#avatarPreview img').src = e.target.result;
      document.getElementById('avatarPreview').style.display = 'block';
    };
    reader.readAsDataURL(file);

    showToast('正在上传图片...', '');
    compressAndUpload(file, 200, 0.8).then(function(url) {
      pendingAvatar = url;
      document.querySelector('#avatarPreview img').src = url;
      showToast('图片上传成功', 'success');
    }).catch(function() {
      alert('图片上传失败，请重试');
      pendingAvatar = null;
    });
  };

  window.saveProfile = async function() {
    var name = document.getElementById('s_name').value.trim();
    if (!name || name.length < 2) { alert('昵称至少 2 个字符'); return; }

    var avatarValue = pendingAvatar !== null ? pendingAvatar : existingAvatar;

    var data = {
      username: name,
      avatar: avatarValue,
      bio: document.getElementById('s_bio').value.trim(),
      favPlayer: document.getElementById('s_favPlayer').value,
      favTeam: document.getElementById('s_favTeam').value
    };

    try {
      var result = await apiPut('/api/profile', data);
      if (!result) return;
      var user = getUser() || {};
      user.username = name;
      localStorage.setItem('glory_user', JSON.stringify(user));
      showToast('个人资料已保存 ✅', 'success');
    } catch(e) {
      showToast('保存失败：' + (e.message || '网络错误'), 'error');
    }
  };

  window.savePassword = async function() {
    var currentPwd = document.getElementById('s_currentPassword').value;
    var newPwd = document.getElementById('s_newPassword').value;
    var confirmPwd = document.getElementById('s_confirmPassword').value;

    if (!currentPwd) { alert('请输入当前密码'); return; }
    if (!newPwd) { alert('请输入新密码'); return; }
    if (newPwd !== confirmPwd) { alert('两次密码不一致'); return; }
    if (newPwd.length < 6) { alert('新密码至少 6 位'); return; }

    try {
      var result = await apiPut('/api/password', { currentPassword: currentPwd, newPassword: newPwd });
      if (!result) return;
      document.getElementById('s_currentPassword').value = '';
      document.getElementById('s_newPassword').value = '';
      document.getElementById('s_confirmPassword').value = '';
      showToast('密码修改成功 🔒', 'success');
    } catch(e) {
      showToast('修改失败：' + (e.message || '网络错误'), 'error');
    }
  };

  loadSettings();
})();
