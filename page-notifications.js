/* ===== notifications.html 页面逻辑 ===== */
(function() {
  if (!getToken()) { alert('请先登录'); window.location.href = 'index.html'; return; }

  var NOTIFY_TYPES = {
    reply: { icon: '💬', label: '回复了你的帖子' },
    like_post: { icon: '👍', label: '赞了你的帖子' },
    like_reply: { icon: '👍', label: '赞了你的回复' },
    mention: { icon: '📢', label: '在回复中提到了你' },
    system: { icon: '🔔', label: '系统通知' }
  };

  var allNotifications = [];
  var currentFilter = 'all';

  async function loadNotifications() {
    try {
      allNotifications = await apiGet('/api/notifications');
      if (!allNotifications) return;
      document.getElementById('loadingState').style.display = 'none';
      renderNotifications();
    } catch(e) {
      console.error('loadNotifications error:', e);
      showErrorState('loadingState', '加载失败', function() { loadNotifications(); });
    }
  }

  function renderNotifications() {
    var filtered = allNotifications;
    if (currentFilter === 'unread') filtered = allNotifications.filter(function(n) { return !n.read; });
    else if (currentFilter !== 'all') filtered = allNotifications.filter(function(n) { return n.type && n.type.indexOf(currentFilter) === 0; });

    var container = document.getElementById('notifyList');
    var empty = document.getElementById('emptyState');

    if (filtered.length === 0) { container.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';

    container.innerHTML = filtered.map(function(n) {
      var typeInfo = NOTIFY_TYPES[n.type] || NOTIFY_TYPES.system;
      var link = n.postId ? 'post-detail.html?id=' + n.postId : '#';
      return '<a class="notify-item ' + (n.read ? '' : 'unread') + '" href="' + link + '" onclick="markRead(\'' + n.id + '\')">' +
        '<div class="notify-icon">' + typeInfo.icon + '</div>' +
        '<div class="notify-body">' +
          '<div class="notify-header"><span class="notify-from">' + escapeForumHtml(n.from || '系统') + '</span><span class="notify-action">' + typeInfo.label + '</span></div>' +
          (n.postTitle ? '<div class="notify-post-title">' + escapeForumHtml(n.postTitle) + '</div>' : '') +
          (n.content ? '<div class="notify-content">' + escapeForumHtml(n.content) + '</div>' : '') +
          '<div class="notify-time">' + forumTimeAgo(n.time) + '</div>' +
        '</div>' +
        (!n.read ? '<div class="notify-dot"></div>' : '') +
      '</a>';
    }).join('');
  }

  window.markRead = async function(id) {
    try { await apiPut('/api/notifications/' + id + '/read'); var n = allNotifications.find(function(x) { return x.id === id; }); if (n) n.read = true; } catch(e) {}
  };

  window.markAllRead = async function() {
    try { await apiPut('/api/notifications/read-all'); allNotifications.forEach(function(n) { n.read = true; }); renderNotifications(); } catch(e) { alert('操作失败'); }
  };

  document.querySelectorAll('.notify-filter-tab').forEach(function(tab) {
    tab.onclick = function() {
      document.querySelectorAll('.notify-filter-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderNotifications();
    };
  });

  loadNotifications();
})();
