/* ===== forum-home.html 页面逻辑 ===== */
(function() {
  async function init() {
    try {
      // 管理员显示公告按钮
      if (isAdmin()) {
        document.getElementById('announceBtn').style.display = 'flex';
      }

      // 并行加载数据
      var results = await Promise.all([
        apiGet('/api/forum/posts?pageSize=1000'),
        apiGet('/api/community/stats').catch(function() { return null; })
      ]);
      var postsResult = results[0];
      var statsResult = results[1];

      var allPosts = postsResult.items || [];

      // 统计
      document.getElementById('totalPosts').textContent = allPosts.length;
      document.getElementById('totalReplies').textContent = allPosts.reduce(function(s, p) { return s + (p.replyCount || 0); }, 0);

      // 今日新帖
      var today = new Date().toISOString().slice(0, 10);
      var todayCount = allPosts.filter(function(p) { return p.createdAt && p.createdAt.slice(0, 10) === today; }).length;
      document.getElementById('todayPosts').textContent = todayCount;

      // 总浏览
      var totalViews = allPosts.reduce(function(sum, p) { return sum + (p.viewCount || 0); }, 0);
      document.getElementById('totalViews').textContent = totalViews > 1000 ? (totalViews / 1000).toFixed(1) + 'k' : totalViews;

      // 渲染版块卡片
      var grid = document.getElementById('categoriesGrid');
      FORUM_CATEGORIES.forEach(function(cat) {
        var posts = allPosts.filter(function(p) { return p.category === cat.id; });
        var catReplies = posts.reduce(function(s, p) { return s + (p.replyCount || 0); }, 0);
        var lastPost = posts.sort(function(a, b) { return new Date(b.lastReplyAt || b.createdAt) - new Date(a.lastReplyAt || a.createdAt); })[0];

        var card = document.createElement('a');
        card.className = 'forum-cat-card';
        card.href = 'forum-category.html?cat=' + cat.id;
        card.innerHTML = '<div class="cat-card-header">' +
            '<span class="cat-card-icon">' + cat.icon + '</span>' +
            '<h3>' + cat.name + '</h3>' +
          '</div>' +
          '<p>' + cat.desc + '</p>' +
          '<div class="cat-stats">' +
            '<span>📝 ' + posts.length + '</span>' +
            '<span>💬 ' + catReplies + '</span>' +
          '</div>' +
          (lastPost ? '<div class="cat-last-post">最新：' + escapeForumHtml(lastPost.title.slice(0, 20)) + (lastPost.title.length > 20 ? '...' : '') + '</div>' : '');
        grid.appendChild(card);
      });

      // 渲染热门帖子
      var hotContainer = document.getElementById('hotPosts');
      var hotPosts = allPosts.filter(function(p) { return !p.isPinned; })
        .sort(function(a, b) { return (b.likeCount + b.replyCount * 2) - (a.likeCount + a.replyCount * 2); })
        .slice(0, 3);

      if (hotPosts.length === 0) {
        hotContainer.innerHTML = '<p style="color:var(--text-3);padding:20px 0;">暂无帖子</p>';
      } else {
        hotContainer.innerHTML = '';
        hotPosts.forEach(function(post) {
          var cat = getCategoryById(post.category);
          var catName = cat ? cat.name : '未知';
          var catIcon = cat ? cat.icon : '📁';
          var item = document.createElement('a');
          item.className = 'post-item hot-post';
          item.href = 'post-detail.html?id=' + post.id;
          item.innerHTML = '<div class="post-avatar hot">' + post.authorName[0] + '</div>' +
            '<div class="post-body">' +
              '<div class="post-title">' + escapeForumHtml(post.title) + '</div>' +
              '<div class="post-excerpt">' + escapeForumHtml(post.content.slice(0, 80)) + (post.content.length > 80 ? '...' : '') + '</div>' +
              '<div class="post-meta">' +
                '<span class="author">' + userLinkHtml(post.authorId, post.authorName) + '</span>' +
                '<span class="user-badge' + (post.authorLevel >= 8 ? ' gold' : post.authorLevel >= 5 ? '' : '') + '">Lv.' + post.authorLevel + '</span>' +
                '<span>' + catIcon + ' ' + catName + '</span>' +
                '<span class="stat">💬 ' + post.replyCount + '</span>' +
                '<span class="stat highlight">👍 ' + post.likeCount + '</span>' +
                '<span>👁️ ' + post.viewCount + '</span>' +
              '</div>' +
            '</div>';
          hotContainer.appendChild(item);
        });
      }

      // 渲染最近活跃帖子（置顶帖排最前）
      var recentContainer = document.getElementById('recentPosts');
      var pinnedPosts = allPosts.filter(function(p) { return p.isPinned; }).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      var normalPosts = allPosts.filter(function(p) { return !p.isPinned; }).sort(function(a, b) { return new Date(b.lastReplyAt || b.createdAt) - new Date(a.lastReplyAt || a.createdAt); });
      var recentPosts = pinnedPosts.concat(normalPosts).slice(0, 8);

      if (recentPosts.length === 0) {
        recentContainer.innerHTML = '<p style="color:var(--text-3);padding:20px 0;">暂无帖子</p>';
      } else {
        recentContainer.innerHTML = '';
        recentPosts.forEach(function(post) {
          var cat = getCategoryById(post.category);
          var catName = cat ? cat.name : '未知';
          var catIcon = cat ? cat.icon : '📁';
          var item = document.createElement('a');
          item.className = 'post-item' + (post.isPinned ? ' pinned' : '');
          item.href = 'post-detail.html?id=' + post.id;
          item.innerHTML = '<div class="post-avatar">' + post.authorName[0] + '</div>' +
            '<div class="post-body">' +
              '<div class="post-title">' +
                (post.isPinned ? '<span class="pin-icon">📌</span>' : '') +
                escapeForumHtml(post.title) +
              '</div>' +
              '<div class="post-meta">' +
                '<span class="author">' + userLinkHtml(post.authorId, post.authorName) + '</span>' +
                '<span class="user-badge' + (post.authorLevel >= 8 ? ' gold' : post.authorLevel >= 5 ? '' : '') + '">Lv.' + post.authorLevel + '</span>' +
                '<span>' + catIcon + ' ' + catName + '</span>' +
                '<span class="stat">💬 ' + post.replyCount + '</span>' +
                '<span class="stat">👍 ' + post.likeCount + '</span>' +
                '<span>' + forumTimeAgo(post.lastReplyAt || post.createdAt) + '</span>' +
              '</div>' +
            '</div>';
          recentContainer.appendChild(item);
        });
      }
    } catch (e) {
      console.error('forum-home init error:', e);
      showErrorState('hotPosts', '加载失败');
      showErrorState('recentPosts', '加载失败');
    }
  }

  init();
})();
