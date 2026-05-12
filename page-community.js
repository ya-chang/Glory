/* ===== community.html 页面逻辑 ===== */
(function() {
  // 热门选手（静态数据）
  var hotIds = ['yexiu','huangshaotian','zhouzekai','wangjiexi','hanwenqing','yuwenzhou'];
  var hotPlayers = PLAYERS.filter(function(p) { return hotIds.indexOf(p.id) !== -1; });
  var grid = document.getElementById('hotPlayers');
  hotPlayers.forEach(function(p) {
    var card = document.createElement('a');
    card.className = 'player-card';
    card.href = 'player-detail.html?id=' + p.id;
    card.innerHTML = '<div class="player-card-top"></div>' +
      '<div class="player-card-body">' +
        '<div class="player-avatar">' + p.avatar + '</div>' +
        '<div class="player-info">' +
          '<h3>' + p.name + '</h3>' +
          '<div class="game-id">' + p.gameId.split('/')[0].trim() + '</div>' +
          '<div class="meta">' +
            '<span class="tag tag-class">' + p.class.split('/')[0].split('（')[0] + '</span>' +
            '<span class="tag tag-team">' + p.team.split('→').pop() + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    grid.appendChild(card);
  });

  // 社区数据（API）
  async function loadCommunityData() {
    try {
      var results = await Promise.all([
        apiGet('/api/community/stats'),
        apiGet('/api/community/hot-posts')
      ]);
      var stats = results[0];
      var hotPosts = results[1];
      if (stats) {
        document.getElementById('statPosts').textContent = stats.postCount || 0;
        document.getElementById('statUsers').textContent = stats.userCount || 0;
        document.getElementById('statOCs').textContent = stats.ocCount || 0;
      }
      if (hotPosts && hotPosts.length > 0) {
        var container = document.getElementById('hotPosts');
        hotPosts.forEach(function(p) {
          var cat = getCategoryById(p.category);
          var div = document.createElement('a');
          div.href = 'post-detail.html?id=' + p.id;
          div.className = 'post-item compact';
          div.innerHTML = '<span style="font-size:20px;">' + (cat ? cat.icon : '💬') + '</span>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeForumHtml(p.title) + '</div>' +
              '<div style="font-size:12px;color:#888;margin-top:2px;">' + p.authorName + ' · ' + forumTimeAgo(p.createdAt) + ' · ❤️ ' + (p.likeCount || 0) + ' · 💬 ' + (p.replyCount || 0) + '</div>' +
            '</div>';
          container.appendChild(div);
        });
      }
    } catch (e) {
      console.error('loadCommunityData error:', e);
      showErrorState('hotPosts', '加载失败');
    }
  }
  loadCommunityData();
})();
