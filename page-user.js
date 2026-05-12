/* ===== user.html 页面逻辑 ===== */
(function() {
  var params = new URLSearchParams(window.location.search);
  var targetEmail = params.get('email');

  if (!targetEmail) {
    document.getElementById('userName').textContent = '参数错误';
    document.getElementById('userPosts').innerHTML = '<p style="color:var(--text-3);text-align:center;padding:20px;">缺少用户参数</p>';
    return;
  }

  loadUserProfile();

  async function loadUserProfile() {
    try {
      var profile = await apiGet('/api/profile/' + encodeURIComponent(targetEmail));
      if (!profile) {
        document.getElementById('userName').textContent = '用户不存在';
        return;
      }

      var avatarEl = document.getElementById('userAvatar');
      if (profile.avatar) {
        avatarEl.innerHTML = '<img src="' + profile.avatar + '" alt="' + escapeForumHtml(profile.username || '') + '">';
      } else {
        avatarEl.textContent = (profile.username || '荣')[0];
      }

      document.getElementById('userName').textContent = profile.username || '荣耀玩家';
      document.getElementById('userJoinDate').textContent = profile.joinDate || '-';
      document.getElementById('statPosts').textContent = (profile.stats && profile.stats.posts) || 0;
      document.getElementById('statOCs').textContent = (profile.stats && profile.stats.ocs) || 0;

      if (profile.exp !== undefined) {
        var LEVELS = [
          { level: 1, name: '新手玩家', exp: 0 },
          { level: 2, name: '网吧常客', exp: 100 },
          { level: 3, name: '业余选手', exp: 300 },
          { level: 4, name: '职业新人', exp: 600 },
          { level: 5, name: '职业选手', exp: 1000 },
          { level: 6, name: '明星选手', exp: 2000 },
          { level: 7, name: '战队队长', exp: 3500 },
          { level: 8, name: '联盟传奇', exp: 5000 },
          { level: 9, name: '荣耀教科书', exp: 8000 },
          { level: 10, name: '荣耀之神', exp: 12000 }
        ];
        var current = LEVELS[0];
        for (var i = LEVELS.length - 1; i >= 0; i--) {
          if (profile.exp >= LEVELS[i].exp) { current = LEVELS[i]; break; }
        }
        document.getElementById('userTitle').textContent = 'Lv.' + current.level + ' · ' + current.name;
      }

      if (profile.bio) {
        document.getElementById('bioCard').style.display = '';
        document.getElementById('userBio').textContent = profile.bio;
      }

      var favItems = [];
      if (profile.favPlayer) favItems.push('🎮 最喜欢的角色：' + profile.favPlayer);
      if (profile.favTeam) favItems.push('🏆 最喜欢的战队：' + profile.favTeam);
      if (favItems.length > 0) {
        document.getElementById('favCard').style.display = '';
        document.getElementById('userFav').innerHTML = favItems.join('<br>');
      }

      loadUserPosts(targetEmail);
      loadUserOCs(targetEmail);
    } catch (e) {
      console.error('loadUserProfile error:', e);
      document.getElementById('userName').textContent = '加载失败';
    }
  }

  async function loadUserPosts(email) {
    try {
      var result = await getPostsByAuthor(email);
      var userPosts = result.items || [];
      var container = document.getElementById('userPosts');

      if (userPosts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div style="font-size:36px;margin-bottom:12px;">📝</div><p>还没有发过帖子</p></div>';
        return;
      }

      container.innerHTML = userPosts.map(function(post) {
        var cat = getCategoryById(post.category);
        return '<a class="post-item" href="post-detail.html?id=' + post.id + '">' +
          '<div class="post-body">' +
            '<div class="post-title">' + escapeForumHtml(post.title) + '</div>' +
            '<div class="post-meta">' +
              '<span>' + (cat ? cat.icon : '📁') + ' ' + (cat ? cat.name : '未知') + '</span>' +
              '<span class="stat">💬 ' + post.replyCount + '</span>' +
              '<span class="stat">👍 ' + post.likeCount + '</span>' +
              '<span class="stat">👁️ ' + post.viewCount + '</span>' +
              '<span>' + forumTimeAgo(post.createdAt) + '</span>' +
            '</div>' +
          '</div>' +
        '</a>';
      }).join('');
    } catch (e) {
      document.getElementById('userPosts').innerHTML = '<p style="color:var(--text-3);padding:20px 0;">加载失败</p>';
    }
  }

  async function loadUserOCs(email) {
    try {
      var allOCs = await getAllOCs();
      var userOCs = allOCs.filter(function(o) { return o.creatorId === email; })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      var container = document.getElementById('userOCs');

      if (userOCs.length === 0) {
        container.innerHTML = '<div class="empty-state"><div style="font-size:36px;margin-bottom:12px;">🧑‍🎨</div><p>还没有创建 OC</p></div>';
        return;
      }

      container.innerHTML = '<div class="oc-grid">' + userOCs.map(function(oc) {
        return '<a class="oc-card" href="oc-detail.html?id=' + oc.id + '">' +
          '<div class="oc-card-top"></div>' +
          '<div class="oc-card-body">' +
            '<div class="oc-avatar">' + (oc.avatar ? '<img src="' + oc.avatar + '" alt="' + escapeForumHtml(oc.name) + '">' : escapeForumHtml(oc.gameId)) + '</div>' +
            '<div class="oc-info">' +
              '<h3>' + escapeForumHtml(oc.name) + '</h3>' +
              '<div class="game-id">' + escapeForumHtml(oc.gameId) + '</div>' +
              '<div class="meta">' +
                '<span class="tag tag-class">' + escapeForumHtml(oc.class) + '</span>' +
                '<span class="tag tag-team">' + escapeForumHtml(oc.team) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</a>';
      }).join('') + '</div>';
    } catch (e) {
      document.getElementById('userOCs').innerHTML = '<p style="color:var(--text-3);padding:20px 0;">加载失败</p>';
    }
  }

  document.querySelectorAll('.profile-tab').forEach(function(tab) {
    tab.onclick = function() {
      document.querySelectorAll('.profile-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.profile-tab-content').forEach(function(c) { c.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    };
  });
})();
