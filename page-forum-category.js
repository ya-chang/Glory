/* ===== forum-category.html 页面逻辑 ===== */
(function() {
  var params = new URLSearchParams(window.location.search);
  var catId = params.get('cat');
  var cat = getCategoryById(catId);

  if (!cat) {
    document.getElementById('pageHeader').innerHTML = '<div class="container" style="text-align:center;padding:40px 0;">' +
      '<h2 style="color:var(--white);">未找到该版块</h2>' +
      '<a href="forum-home.html" style="color:rgba(255,255,255,0.7);margin-top:12px;display:inline-block;">← 返回讨论区</a>' +
    '</div>';
    document.querySelector('.container').style.display = 'none';
    return;
  }

  document.title = cat.name + ' · 讨论区 · 荣耀社区';
  document.getElementById('catTitle').textContent = cat.icon + ' ' + cat.name;
  document.getElementById('catDesc').textContent = cat.desc;
  document.getElementById('breadcrumbCurrent').textContent = cat.name;

  var newPostId = params.get('new');
  if (newPostId) {
    var banner = document.createElement('div');
    banner.className = 'success-banner';
    banner.innerHTML = '<span>✅ 帖子发布成功！</span><button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:16px;cursor:pointer;color:var(--text-3);">✕</button>';
    document.querySelector('.container').insertBefore(banner, document.querySelector('.breadcrumb'));
  }

  var currentSort = 'latest';
  var currentPage = 1;
  var currentTag = null;
  var allCategoryPosts = [];

  async function loadTags() {
    try {
      var result = await apiGet('/api/forum/posts?category=' + catId + '&pageSize=1000');
      allCategoryPosts = result.items || [];
      var allTags = [];
      allCategoryPosts.forEach(function(p) { (p.tags || []).forEach(function(t) { if (allTags.indexOf(t) === -1) allTags.push(t); }); });
      var tagsContainer = document.getElementById('availableTags');
      if (allTags.length > 0) {
        tagsContainer.innerHTML = allTags.map(function(t) {
          return '<button class="tag-filter-btn" onclick="filterByTag(\'' + escapeForumHtml(t) + '\')">' + escapeForumHtml(t) + '</button>';
        }).join('');
      }
    } catch (e) {}
  }

  window.filterByTag = function(tag) {
    currentTag = tag;
    currentPage = 1;
    document.getElementById('tagFilterWrap').style.display = 'flex';
    document.getElementById('activeTagFilter').textContent = tag;
    document.querySelectorAll('.tag-filter-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.textContent === tag);
    });
    render();
  };

  window.clearTagFilter = function() {
    currentTag = null;
    currentPage = 1;
    document.getElementById('tagFilterWrap').style.display = 'none';
    document.querySelectorAll('.tag-filter-btn').forEach(function(btn) { btn.classList.remove('active'); });
    render();
  };

  async function render() {
    var list = document.getElementById('postList');
    var empty = document.getElementById('emptyState');
    var countEl = document.getElementById('postCount');

    list.innerHTML = '<p style="color:var(--text-3);padding:20px 0;">加载中...</p>';

    try {
      var result = await getPostsByCategory(catId, { sort: currentSort, page: currentPage });

      if (currentTag) {
        result.items = result.items.filter(function(p) { return p.tags && p.tags.indexOf(currentTag) !== -1; });
        result.total = result.items.length;
        result.totalPages = 1;
      }

      list.innerHTML = '';
      countEl.textContent = '共 ' + result.total + ' 帖';

      if (result.items.length === 0) {
        empty.style.display = 'block';
        document.getElementById('pagination').innerHTML = '';
        return;
      }
      empty.style.display = 'none';

      result.items.forEach(function(post) {
        var item = document.createElement('a');
        item.className = 'post-item' + (post.isPinned ? ' pinned' : '') + (post.isLocked ? ' locked' : '');
        item.href = 'post-detail.html?id=' + post.id;

        var tagsHtml = '';
        if (post.tags && post.tags.length > 0) {
          tagsHtml = '<div class="post-tags">' + post.tags.map(function(t) {
            return '<span class="post-tag' + (currentTag === t ? ' active' : '') + '" onclick="event.stopPropagation();filterByTag(\'' + escapeForumHtml(t) + '\')">' + escapeForumHtml(t) + '</span>';
          }).join('') + '</div>';
        }

        var excerpt = post.content.length > 120 ? post.content.substring(0, 120) + '...' : post.content;
        var isHot = (post.likeCount + post.replyCount) > 20;

        item.innerHTML = '<div class="post-avatar' + (isHot ? ' hot' : '') + '">' + post.authorName[0] + '</div>' +
          '<div class="post-body">' +
            '<div class="post-title">' +
              (post.isPinned ? '<span class="pin-icon">📌</span>' : '') +
              (post.isLocked ? '<span class="lock-icon">🔒</span>' : '') +
              (isHot ? '<span class="hot-icon">🔥</span>' : '') +
              escapeForumHtml(post.title) +
            '</div>' +
            tagsHtml +
            '<div class="post-excerpt">' + escapeForumHtml(excerpt) + '</div>' +
            '<div class="post-meta">' +
              '<span class="author">' + userLinkHtml(post.authorId, post.authorName) + '</span>' +
              '<span class="user-badge' + (post.authorLevel >= 8 ? ' gold' : post.authorLevel >= 5 ? '' : '') + '">Lv.' + post.authorLevel + '</span>' +
              '<span class="stat">💬 ' + post.replyCount + '</span>' +
              '<span class="stat">👍 ' + post.likeCount + '</span>' +
              '<span class="stat">👁️ ' + post.viewCount + '</span>' +
              '<span>' + forumTimeAgo(post.lastReplyAt || post.createdAt) + '</span>' +
            '</div>' +
          '</div>';
        list.appendChild(item);
      });

      renderPagination(result);
    } catch (e) {
      console.error('forum-category render error:', e);
      showErrorState('postList', '加载失败', function() { render(); });
    }
  }

  function renderPagination(result) {
    var container = document.getElementById('pagination');
    container.innerHTML = '';
    if (result.totalPages <= 1) return;

    var prev = document.createElement('a');
    prev.className = 'page-btn' + (currentPage <= 1 ? ' disabled' : '');
    prev.textContent = '← 上一页';
    prev.href = '#';
    prev.onclick = function(e) { e.preventDefault(); if (currentPage > 1) { currentPage--; render(); window.scrollTo({top:0}); } };
    container.appendChild(prev);

    for (var i = 1; i <= result.totalPages; i++) {
      (function(pageNum) {
        var btn = document.createElement('a');
        btn.className = 'page-btn' + (pageNum === currentPage ? ' active' : '');
        btn.textContent = pageNum;
        btn.href = '#';
        btn.onclick = function(e) { e.preventDefault(); currentPage = pageNum; render(); window.scrollTo({top:0}); };
        container.appendChild(btn);
      })(i);
    }

    var next = document.createElement('a');
    next.className = 'page-btn' + (currentPage >= result.totalPages ? ' disabled' : '');
    next.textContent = '下一页 →';
    next.href = '#';
    next.onclick = function(e) { e.preventDefault(); if (currentPage < result.totalPages) { currentPage++; render(); window.scrollTo({top:0}); } };
    container.appendChild(next);
  }

  document.querySelectorAll('.sort-tab').forEach(function(tab) {
    tab.onclick = function() {
      document.querySelectorAll('.sort-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentSort = tab.dataset.sort;
      currentPage = 1;
      render();
    };
  });

  loadTags();
  render();
})();
