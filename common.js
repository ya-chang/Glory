/* ===== 荣耀社区 - 公共 JS 工具库 ===== */
/* 提取自各页面的重复代码，统一管理 */

const API_BASE = 'https://glory-api-feqlkejziv.cn-hangzhou.fcapp.run';

/* ===== 页面过渡 ===== */
(function() {
  // 页面离开时轻微淡出
  window.addEventListener('beforeunload', function() {
    document.body.style.opacity = '0.6';
    document.body.style.transition = 'opacity 0.1s ease';
  });
  // 浏览器后退（bfcache恢复）时重置透明度
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      document.body.style.opacity = '1';
      document.body.style.transition = 'none';
    }
  });
})();

/* ===== Auth 工具 ===== */
function getToken() {
  return localStorage.getItem('glory_token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('glory_user') || 'null'); }
  catch(e) { return null; }
}

function authHeaders() {
  const token = getToken();
  return token
    ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function handleAuthError(res) {
  if (res.status === 401) {
    localStorage.removeItem('glory_token');
    localStorage.removeItem('glory_user');
    window.location.href = 'index.html';
    return true;
  }
  return false;
}

/* ===== API 请求（带重试） ===== */
async function apiGet(path) {
  const res = await fetchWithRetry(API_BASE + path, { headers: authHeaders() });
  if (handleAuthError(res)) return null;
  if (!res.ok) throw new Error((await res.json()).error || '请求失败');
  return res.json();
}

async function apiPost(path, data) {
  const res = await fetchWithRetry(API_BASE + path, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data)
  });
  if (handleAuthError(res)) return null;
  if (!res.ok) throw new Error((await res.json()).error || '请求失败');
  return res.json();
}

async function apiPut(path, data) {
  const res = await fetchWithRetry(API_BASE + path, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data)
  });
  if (handleAuthError(res)) return null;
  if (!res.ok) throw new Error((await res.json()).error || '请求失败');
  return res.json();
}

async function apiDelete(path) {
  const res = await fetchWithRetry(API_BASE + path, {
    method: 'DELETE', headers: authHeaders()
  });
  if (handleAuthError(res)) return null;
  if (!res.ok) throw new Error((await res.json()).error || '请求失败');
  return res.json();
}

/* 带重试的 fetch（自动重试2次，15秒超时） */
async function fetchWithRetry(url, options, retries, delay) {
  retries = retries || 2; delay = delay || 2000;
  for (var i = 0; i <= retries; i++) {
    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function() { controller.abort(); }, 15000);
      var mergedOpts = Object.assign({}, options || {}, { signal: controller.signal });
      var response = await fetch(url, mergedOpts);
      clearTimeout(timeoutId);
      return response;
    } catch(err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        if (i < retries) { await new Promise(function(r){ setTimeout(r, delay); }); continue; }
        throw new Error('请求超时，服务器响应较慢');
      }
      if (i < retries) { await new Promise(function(r){ setTimeout(r, delay); }); continue; }
      throw err;
    }
  }
}

/* ===== Toast 通知 ===== */
function showToast(msg, type) {
  var existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.className = 'toast-msg' + (type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { toast.remove(); }, 300); }, 2500);
}

/* ===== 图片上传到图床 ===== */
async function uploadToImgHost(file) {
  var formData = new FormData();
  formData.append('source', file);
  var res = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
    method: 'POST', body: formData
  });
  if (!res.ok) throw new Error('图片上传失败');
  var data = await res.json();
  if (!data.image || !data.image.url) throw new Error('图片上传失败');
  return data.image.url;
}

/* 压缩图片后上传到图床，返回 URL */
async function compressAndUpload(file, maxSize, quality) {
  maxSize = maxSize || 200; quality = quality || 0.8;
  // 先压缩
  var dataUrl = await new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function(blob) { resolve(blob); }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  // 将 Blob 转为 File（确保有文件名和类型）
  var imgFile = new File([dataUrl], 'avatar_' + Date.now() + '.jpg', { type: 'image/jpeg' });
  // 上传到图床
  return await uploadToImgHost(imgFile);
}

/* ===== 论坛工具函数 ===== */
var FORUM_CATEGORIES = [
  { id: 'original', name: '原作讨论', icon: '📖', desc: '小说、动画、漫画、角色分析', color: '#1a73e8' },
  { id: 'fanwork', name: '同人创作', icon: '🎨', desc: '同人文、同人图、COS、视频', color: '#34a853' },
  { id: 'casual', name: '灌水闲聊', icon: '🌊', desc: '日常、表情包、荣耀梗', color: '#e65100' },
  { id: 'meta', name: '站务中心', icon: '📢', desc: '公告、规则、建议反馈', color: '#6a1b9a' }
];

function getCategoryById(id) {
  for (var i = 0; i < FORUM_CATEGORIES.length; i++) {
    if (FORUM_CATEGORIES[i].id === id) return FORUM_CATEGORIES[i];
  }
  return null;
}

function forumTimeAgo(iso) {
  var diff = Date.now() - new Date(iso).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return mins + ' 分钟前';
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + ' 小时前';
  var days = Math.floor(hours / 24);
  if (days < 30) return days + ' 天前';
  return new Date(iso).toLocaleDateString('zh-CN');
}

function escapeForumHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function userLinkHtml(authorId, authorName) {
  var safeName = escapeForumHtml(authorName || '匿名');
  if (authorId) return '<a href="user.html?email=' + encodeURIComponent(authorId) + '" class="user-link">' + safeName + '</a>';
  return safeName;
}

function formatPostContent(text) {
  if (!text) return '';
  var html = escapeForumHtml(text);
  // 图片 markdown: ![alt](url) → <img>
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" class="post-inline-img" loading="lazy" onclick="window.open(this.src,\'_blank\')" style="max-width:100%;border-radius:8px;margin:8px 0;cursor:pointer;">');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="post-quote">$1</blockquote>');
  html = html.replace(/@(\S+)/g, '<span class="mention-user">@$1</span>');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/<br><blockquote/g, '<blockquote');
  html = html.replace(/<\/blockquote><br/g, '</blockquote');
  return html;
}

/* ===== 导航栏生成 ===== */
function renderNav(activePage) {
  var pages = [
    { href: 'community.html', label: '首页', id: 'home' },
    { href: 'players.html', label: '选手百科', id: 'players' },
    { href: 'teams.html', label: '战队阵容', id: 'teams' },
    { href: 'forum-home.html', label: '讨论区', id: 'forum' },
    { href: 'oc-home.html', label: 'OC中心', id: 'oc' }
  ];
  var navHtml = '';
  pages.forEach(function(p) {
    navHtml += '<a href="' + p.href + '" class="' + (p.id === activePage ? 'active' : '') + '">' + p.label + '</a>';
  });
  var topbar = document.querySelector('.topbar-nav');
  if (topbar) topbar.innerHTML = navHtml;
}

/* ===== 管理员工具 ===== */
function isAdmin() {
  var user = getUser();
  return user && user.role === 'admin';
}

function getRole() {
  var user = getUser();
  return (user && user.role) || 'user';
}

/* ===== 规则弹窗 ===== */
var RULES_KEY = 'glory_rules_accepted';

function hasAcceptedRules() {
  return localStorage.getItem(RULES_KEY) === 'true';
}

function acceptRules() {
  localStorage.setItem(RULES_KEY, 'true');
}

function showRulesModal(onAccept) {
  if (hasAcceptedRules()) {
    if (onAccept) onAccept();
    return;
  }

  var overlay = document.createElement('div');
  overlay.id = 'rulesModalOverlay';
  overlay.innerHTML = '<div class="rules-modal">' +
    '<div class="rules-modal-header">' +
      '<h2>📜 社区规则与免责声明</h2>' +
    '</div>' +
    '<div class="rules-modal-body">' +
      '<div class="rules-section">' +
        '<h3>⚠️ 免责声明</h3>' +
        '<ul>' +
          '<li>本社区为《全职高手》同人爱好者交流平台，所有内容均为用户原创或同人创作，不代表官方立场。</li>' +
          '<li>用户在本社区发表的内容仅代表其个人观点，与本站运营方无关。</li>' +
          '<li>本站不对用户发布内容的准确性、完整性或合法性承担责任。</li>' +
        '</ul>' +
      '</div>' +
      '<div class="rules-section">' +
        '<h3>📋 社区守则</h3>' +
        '<ul>' +
          '<li><strong>尊重他人</strong>：禁止人身攻击、辱骂、骚扰、歧视等行为。</li>' +
          '<li><strong>合法合规</strong>：禁止发布违反国家法律法规的内容，包括但不限于暴力、色情、赌博、毒品等。</li>' +
          '<li><strong>保护隐私</strong>：禁止泄露他人个人信息（真实姓名、电话、地址等）。</li>' +
          '<li><strong>原创尊重</strong>：转载他人作品请注明出处，禁止盗用他人原创内容。</li>' +
          '<li><strong>禁止广告</strong>：禁止发布与社区主题无关的商业广告或垃圾信息。</li>' +
          '<li><strong>账号安全</strong>：禁止注册多个账号进行刷帖、刷赞等违规操作。</li>' +
          '<li><strong>未成年人保护</strong>：禁止发布可能对未成年人造成不良影响的内容。</li>' +
        '</ul>' +
      '</div>' +
      '<div class="rules-section">' +
        '<h3>⚖️ 违规处理</h3>' +
        '<ul>' +
          '<li>违规内容将被删除，严重违规者将被封禁账号。</li>' +
          '<li>管理员有权对违规帖子进行删除、锁定或置顶警告。</li>' +
          '<li>如对处理结果有异议，可通过站务中心反馈。</li>' +
        '</ul>' +
      '</div>' +
      '<div class="rules-section">' +
        '<h3>📌 注意事项</h3>' +
        '<ul>' +
          '<li>发帖前请先搜索是否已有类似话题，避免重复。</li>' +
          '<li>同人创作请标注CP和分级，方便其他用户筛选。</li>' +
          '<li>遇到问题可联系管理员或在站务中心发帖反馈。</li>' +
          '<li>本规则可能不定期更新，请关注公告。</li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div class="rules-modal-footer">' +
      '<label class="rules-checkbox">' +
        '<input type="checkbox" id="rulesCheckbox"> ' +
        '<span>我已阅读并同意遵守以上规则</span>' +
      '</label>' +
      '<button class="btn btn-primary rules-accept-btn" id="rulesAcceptBtn" disabled>确认进入</button>' +
    '</div>' +
  '</div>';

  document.body.appendChild(overlay);

  var checkbox = document.getElementById('rulesCheckbox');
  var acceptBtn = document.getElementById('rulesAcceptBtn');

  checkbox.addEventListener('change', function() {
    acceptBtn.disabled = !checkbox.checked;
  });

  acceptBtn.addEventListener('click', function() {
    if (!checkbox.checked) return;
    acceptRules();
    overlay.remove();
    if (onAccept) onAccept();
  });

  // 添加样式
  if (!document.getElementById('rulesModalStyles')) {
    var style = document.createElement('style');
    style.id = 'rulesModalStyles';
    style.textContent = '#rulesModalOverlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}' +
      '.rules-modal{background:#fff;border-radius:12px;max-width:560px;width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:rulesSlideIn .3s ease}' +
      '@keyframes rulesSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +
      '.rules-modal-header{padding:20px 24px 12px;border-bottom:1px solid #eee;flex-shrink:0}' +
      '.rules-modal-header h2{font-size:18px;font-weight:700;color:#1a1a1a;margin:0}' +
      '.rules-modal-body{padding:16px 24px;overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch}' +
      '.rules-section{margin-bottom:16px}' +
      '.rules-section h3{font-size:15px;font-weight:700;color:#333;margin-bottom:8px}' +
      '.rules-section ul{margin:0 0 0 18px;padding:0}' +
      '.rules-section li{font-size:13px;color:#555;line-height:1.8;margin-bottom:4px}' +
      '.rules-modal-footer{padding:16px 24px 20px;border-top:1px solid #eee;flex-shrink:0;text-align:center}' +
      '.rules-checkbox{display:flex;align-items:center;gap:8px;justify-content:center;font-size:13px;color:#555;cursor:pointer;margin-bottom:14px}' +
      '.rules-checkbox input{width:16px;height:16px;cursor:pointer}' +
      '.rules-accept-btn{padding:10px 32px;font-size:14px;font-weight:600;border-radius:8px;min-width:160px}' +
      '@media(max-width:480px){.rules-modal{max-height:90vh;border-radius:10px}.rules-modal-header{padding:16px 16px 10px}.rules-modal-body{padding:12px 16px}.rules-modal-footer{padding:12px 16px 16px}.rules-section li{font-size:12px;line-height:1.7}}';
    document.head.appendChild(style);
  }
}
