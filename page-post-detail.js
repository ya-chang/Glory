/* ===== post-detail.html 页面逻辑 ===== */
(function() {
  var FAVORITE_KEY = 'glory_forum_favorites';
  var params = new URLSearchParams(window.location.search);
  var postId = params.get('id');
  var post = null;
  var replies = [];

  async function init() {
    try {
      post = await getPostById(postId);
      if (!post) {
        document.getElementById('postSection').style.display = 'none';
        document.getElementById('replySection').style.display = 'none';
        document.getElementById('notFound').style.display = 'block';
        document.getElementById('breadcrumb').style.display = 'none';
        return;
      }

      document.title = post.title + ' · 讨论区 · 荣耀社区';

      var cat = getCategoryById(post.category);
      var catName = cat ? cat.name : '未知';
      var catIcon = cat ? cat.icon : '📁';

      document.getElementById('breadcrumb').innerHTML =
        '<a href="forum-home.html">讨论区</a>' +
        '<span class="sep">/</span>' +
        '<a href="forum-category.html?cat=' + post.category + '">' + catIcon + ' ' + catName + '</a>' +
        '<span class="sep">/</span>' +
        '<span>' + escapeForumHtml(post.title) + '</span>';

      replies = await getRepliesByPost(postId);
      renderPost();
      renderReplies();
    } catch (e) {
      console.error('post-detail init error:', e);
      showErrorState('postSection', '帖子加载失败', function() { init(); });
    }
  }

  function isFavorited() {
    try {
      var data = localStorage.getItem(FAVORITE_KEY);
      var favs = data ? JSON.parse(data) : {};
      return !!favs[postId];
    } catch(e) { return false; }
  }

  function toggleFavoriteLocal() {
    try {
      var data = localStorage.getItem(FAVORITE_KEY);
      var favs = data ? JSON.parse(data) : {};
      if (favs[postId]) { delete favs[postId]; }
      else { favs[postId] = true; }
      localStorage.setItem(FAVORITE_KEY, JSON.stringify(favs));
      return !!favs[postId];
    } catch(e) { return false; }
  }

  function renderPost() {
    var section = document.getElementById('postSection');
    var liked = isLiked('post', post.id);
    var favorited = isFavorited();

    var tagsHtml = '';
    if (post.tags && post.tags.length > 0) {
      tagsHtml = '<div class="post-tags" style="margin-bottom:14px;">' +
        post.tags.map(function(t) { return '<a class="post-tag" href="forum-category.html?cat=' + post.category + '" onclick="event.stopPropagation()">' + escapeForumHtml(t) + '</a>'; }).join('') + '</div>';
    }

    var formattedContent = formatPostContent(post.content);
    var user = getUser();
    var isOwner = user && user.email === post.authorId;
    var admin = isAdmin();

    var adminHtml = '';
    if (admin) {
      adminHtml = '<button class="post-action-btn" onclick="handlePinPost()" style="color:#e65100;">' +
        (post.isPinned ? '📌 取消置顶' : '📌 置顶') + '</button>' +
        '<button class="post-action-btn" onclick="handleLockPost()" style="color:#6a1b9a;">' +
        (post.isLocked ? '🔓 解锁帖子' : '🔒 锁定帖子') + '</button>';
    }

    section.innerHTML =
      '<div class="post-detail-card">' +
        (post.isPinned ? '<div style="background:#fff3e0;color:#e65100;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:12px;display:inline-block;">📌 已置顶</div>' : '') +
        (post.isLocked ? '<div style="background:#f3e5f5;color:#6a1b9a;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:12px;display:inline-block;">🔒 帖子已锁定</div>' : '') +
        '<div class="post-detail-title">' + escapeForumHtml(post.title) + '</div>' +
        '<div class="post-detail-info">' +
          '<div class="post-author-row">' +
            '<div class="post-author-avatar">' + post.authorName[0] + '</div>' +
            '<div class="post-author-meta">' +
              '<span class="author">' + userLinkHtml(post.authorId, post.authorName) + '</span>' +
              '<span class="user-badge' + (post.authorLevel >= 8 ? ' gold' : post.authorLevel >= 5 ? '' : '') + '">Lv.' + post.authorLevel + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="post-time-row">' +
            '<span>📅 ' + new Date(post.createdAt).toLocaleString('zh-CN') + '</span>' +
            '<span>👁️ ' + post.viewCount + ' 次浏览</span>' +
          '</div>' +
        '</div>' +
        tagsHtml +
        '<div class="post-detail-content">' + formattedContent + '</div>' +
        '<div class="post-detail-actions">' +
          '<button class="post-action-btn ' + (liked ? 'liked' : '') + '" onclick="handleLikePost(this)">' +
            '👍 <span>' + post.likeCount + '</span>' +
          '</button>' +
          '<button class="post-action-btn ' + (favorited ? 'favorited' : '') + '" onclick="handleFavorite(this)">' +
            '⭐ <span>' + (favorited ? '已收藏' : '收藏') + '</span>' +
          '</button>' +
          '<button class="post-action-btn" onclick="scrollToReply()">' +
            '💬 回复' +
          '</button>' +
          '<button class="post-action-btn" onclick="sharePost()">' +
            '🔗 分享' +
          '</button>' +
          adminHtml +
          (isOwner || admin ? '<button class="post-action-btn post-action-delete" onclick="handleDeletePost()">🗑️ 删除</button>' : '') +
        '</div>' +
      '</div>';
  }

  function renderReplies() {
    var section = document.getElementById('replySection');
    var topReplies = replies.filter(function(r) { return !r.replyTo; });
    var childReplies = replies.filter(function(r) { return r.replyTo; });
    var user = getUser();
    var admin = isAdmin();

    var repliesHtml = '';
    if (replies.length > 0) {
      repliesHtml = topReplies.map(function(r, index) {
        var liked = isLiked('reply', r.id);
        var mentionHtml = '';
        if (r.mentionUser) {
          mentionHtml = '<span class="mention-user">@' + escapeForumHtml(r.mentionUser) + '</span> ';
        }

        var canDeleteReply = admin || (user && user.email === r.authorId);

        var children = childReplies.filter(function(cr) { return cr.replyTo === r.id; });
        var childrenHtml = '';
        if (children.length > 0) {
          childrenHtml = '<div class="reply-children">' + children.map(function(cr) {
            var childLiked = isLiked('reply', cr.id);
            var childMention = cr.mentionUser ? '<span class="mention-user">@' + escapeForumHtml(cr.mentionUser) + '</span> ' : '';
            var canDeleteChild = admin || (user && user.email === cr.authorId);
            return '<div class="reply-child" id="reply-' + cr.id + '">' +
              '<div class="reply-child-avatar">' + cr.authorName[0] + '</div>' +
              '<div class="reply-child-body">' +
                '<div class="reply-header">' +
                  '<span class="author">' + userLinkHtml(cr.authorId, cr.authorName) + '</span>' +
                  '<span class="user-badge' + (cr.authorLevel >= 8 ? ' gold' : cr.authorLevel >= 5 ? '' : '') + '">Lv.' + cr.authorLevel + '</span>' +
                  '<span class="reply-time">' + forumTimeAgo(cr.createdAt) + '</span>' +
                '</div>' +
                '<div class="reply-text">' + childMention + formatPostContent(cr.content) + '</div>' +
                '<div class="reply-actions">' +
                  '<button class="reply-action ' + (childLiked ? 'liked' : '') + '" onclick="handleLikeReply(this, \'' + cr.id + '\')">👍 ' + cr.likeCount + '</button>' +
                  '<button class="reply-action" onclick="replyToUser(\'' + escapeForumHtml(cr.authorName) + '\', \'' + cr.id + '\')">回复</button>' +
                  (canDeleteChild ? '<button class="reply-action" onclick="handleDeleteReply(\'' + cr.id + '\')" style="color:#c62828;">🗑️</button>' : '') +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('') + '</div>';
        }

        return '<div class="reply-item" id="reply-' + r.id + '">' +
          '<div class="reply-avatar">' + r.authorName[0] + '</div>' +
          '<div class="reply-body">' +
            '<div class="reply-header">' +
              '<span class="author">' + userLinkHtml(r.authorId, r.authorName) + '</span>' +
              '<span class="user-badge' + (r.authorLevel >= 8 ? ' gold' : r.authorLevel >= 5 ? '' : '') + '">Lv.' + r.authorLevel + '</span>' +
              '<span class="reply-time">' + forumTimeAgo(r.createdAt) + '</span>' +
              '<span class="reply-floor">#' + (index + 1) + '</span>' +
            '</div>' +
            '<div class="reply-text">' + mentionHtml + formatPostContent(r.content) + '</div>' +
            '<div class="reply-actions">' +
              '<button class="reply-action ' + (liked ? 'liked' : '') + '" onclick="handleLikeReply(this, \'' + r.id + '\')">👍 ' + r.likeCount + '</button>' +
              '<button class="reply-action" onclick="replyToUser(\'' + escapeForumHtml(r.authorName) + '\', \'' + r.id + '\')">💬 回复</button>' +
              (canDeleteReply ? '<button class="reply-action" onclick="handleDeleteReply(\'' + r.id + '\')" style="color:#c62828;">🗑️ 删除</button>' : '') +
            '</div>' +
            childrenHtml +
          '</div>' +
        '</div>';
      }).join('');
    } else {
      repliesHtml = '<div class="reply-empty">' +
        '<div style="font-size:36px;margin-bottom:8px;">💬</div>' +
        '<p>暂无回复，快来抢沙发！</p>' +
      '</div>';
    }

    var hasToken = !!getToken();
    var replyFormHtml = post.isLocked ? '<p style="color:var(--text-3);padding:16px 0;font-size:14px;text-align:center;">🔒 该帖子已锁定，无法回复</p>' : (hasToken ? 
      '<div class="reply-form-wrap" id="replyForm">' +
        '<div class="reply-form-header">写下你的回复</div>' +
        '<div class="comment-form">' +
          '<textarea id="replyInput" placeholder="说点什么..." rows="3"></textarea>' +
          '<button class="btn btn-primary" onclick="submitReply()">发送</button>' +
        '</div>' +
        '<div class="reply-form-hint">支持 @提及用户，点击回复按钮自动填入</div>' +
      '</div>' 
      : '<p style="color:var(--text-3);padding:16px 0;font-size:14px;text-align:center;"><a href="index.html" style="color:var(--blue-3);">登录</a>后才能回复</p>');

    section.innerHTML =
      '<div class="info-card" style="margin-top:20px;">' +
        '<div class="reply-section-header">' +
          '<h2>💬 回复（' + replies.length + '）</h2>' +
        '</div>' +
        '<div class="reply-list">' + repliesHtml + '</div>' +
        replyFormHtml +
      '</div>';
  }

  window.handleLikePost = async function(btn) {
    try {
      var result = await toggleLike('post', post.id);
      post.likeCount = result.likeCount;
      btn.classList.toggle('liked', result.liked);
      btn.querySelector('span').textContent = result.likeCount;
    } catch (e) {
      showToast('操作失败：' + e.message);
    }
  };

  window.handleFavorite = function(btn) {
    var fav = toggleFavoriteLocal();
    btn.classList.toggle('favorited', fav);
    btn.querySelector('span').textContent = fav ? '已收藏' : '收藏';
  };

  window.handleLikeReply = async function(btn, replyId) {
    try {
      var result = await toggleLike('reply', replyId);
      var r = replies.find(function(x) { return x.id === replyId; });
      if (r) r.likeCount = result.likeCount;
      btn.textContent = '👍 ' + result.likeCount;
      btn.classList.toggle('liked', result.liked);
    } catch (e) {
      showToast('操作失败：' + e.message);
    }
  };

  window.replyToUser = function(username, replyId) {
    var input = document.getElementById('replyInput');
    if (!input) return;
    input.value = '@' + username + ' ';
    input.focus();
    input.dataset.replyTo = replyId;
    input.dataset.mentionUser = username;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  window.scrollToReply = function() {
    var input = document.getElementById('replyInput');
    if (input) {
      input.focus();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  window.submitReply = async function() {
    var input = document.getElementById('replyInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) { alert('请输入回复内容'); return; }

    try {
      await createReply({
        postId: postId,
        content: text,
        replyTo: input.dataset.replyTo || null,
        mentionUser: input.dataset.mentionUser || null
      });

      input.value = '';
      delete input.dataset.replyTo;
      delete input.dataset.mentionUser;

      post = await getPostById(postId);
      replies = await getRepliesByPost(postId);
      renderPost();
      renderReplies();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      showToast('回复成功！');
    } catch (e) {
      showToast('回复失败：' + e.message);
    }
  };

  window.sharePost = function() {
    var url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        showToast('链接已复制到剪贴板');
      }).catch(function() {
        prompt('复制以下链接分享：', url);
      });
    } else {
      prompt('复制以下链接分享：', url);
    }
  };

  window.handleDeletePost = async function() {
    if (!confirm('确定要删除这篇帖子吗？删除后无法恢复。')) return;
    try {
      await deletePost(postId);
      showToast('帖子已删除');
      setTimeout(function() {
        window.location.href = 'forum-category.html?cat=' + post.category;
      }, 800);
    } catch (e) {
      showToast('删除失败：' + e.message);
    }
  };

  window.handlePinPost = async function() {
    try {
      var result = await apiPut('/api/admin/posts/' + postId + '/pin', {});
      if (!result) return;
      post.isPinned = result.isPinned;
      renderPost();
      showToast(result.message);
    } catch (e) {
      showToast('操作失败：' + e.message);
    }
  };

  window.handleLockPost = async function() {
    try {
      var result = await apiPut('/api/admin/posts/' + postId + '/lock', {});
      if (!result) return;
      post.isLocked = result.isLocked;
      renderPost();
      renderReplies();
      showToast(result.message);
    } catch (e) {
      showToast('操作失败：' + e.message);
    }
  };

  window.handleDeleteReply = async function(replyId) {
    if (!confirm('确定要删除这条回复吗？')) return;
    try {
      await apiDelete('/api/forum/replies/' + replyId);
      post = await getPostById(postId);
      replies = await getRepliesByPost(postId);
      renderPost();
      renderReplies();
      showToast('回复已删除');
    } catch (e) {
      showToast('删除失败：' + e.message);
    }
  };

  init();
})();
