/* ===== profile.html 页面逻辑 ===== */
(function() {
  if (!getToken()) {
    alert('请先登录');
    window.location.href = 'index.html';
    return;
  }

  var CHECKIN_KEY = 'glory_checkin';

  function getCheckinData() {
    try {
      var data = localStorage.getItem(CHECKIN_KEY);
      return data ? JSON.parse(data) : { dates: [], streak: 0, lastDate: '' };
    } catch(e) { return { dates: [], streak: 0, lastDate: '' }; }
  }

  function getToday() { return new Date().toISOString().slice(0, 10); }

  function isTodayCheckedIn() { return getCheckinData().lastDate === getToday(); }

  function calcStreak(dates) {
    if (dates.length === 0) return 0;
    var sorted = dates.slice().sort().reverse();
    var streak = 1;
    var today = getToday();
    if (sorted[0] !== today) {
      var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (sorted[0] !== yesterday) return 0;
    }
    for (var i = 1; i < sorted.length; i++) {
      var prev = new Date(sorted[i - 1]);
      var curr = new Date(sorted[i]);
      if ((prev - curr) / 86400000 === 1) streak++;
      else break;
    }
    return streak;
  }

  window.doCheckin = function() {
    if (isTodayCheckedIn()) return;
    var data = getCheckinData();
    var today = getToday();
    data.dates.push(today);
    data.lastDate = today;
    data.streak = calcStreak(data.dates);
    localStorage.setItem(CHECKIN_KEY, JSON.stringify(data));
    renderCheckin();
    showToast('签到成功！+10 EXP 🎉');
  };

  function renderCheckin() {
    var data = getCheckinData();
    var checked = isTodayCheckedIn();
    data.streak = calcStreak(data.dates);

    document.getElementById('checkinStreak').textContent = data.streak;
    document.getElementById('checkinTotal').textContent = data.dates.length;
    document.getElementById('checkinExpEarned').textContent = data.dates.length * 10;

    var btn = document.getElementById('checkinBtn');
    var status = document.getElementById('checkinStatus');
    if (checked) {
      btn.disabled = true;
      btn.textContent = '✅ 今日已签到';
      btn.classList.add('checked');
      status.innerHTML = '<span class="checkin-done">今日已签到 +10 EXP</span>';
    } else {
      btn.disabled = false;
      btn.textContent = '✅ 签到 +10 EXP';
      btn.classList.remove('checked');
      status.innerHTML = '<span class="checkin-pending">今日还未签到</span>';
    }

    var cal = document.getElementById('checkinCalendar');
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var dateStr = d.toISOString().slice(0, 10);
      var dayLabel = ['日','一','二','三','四','五','六'][d.getDay()];
      var done = data.dates.indexOf(dateStr) !== -1;
      var isToday = dateStr === getToday();
      days.push('<div class="cal-day ' + (done ? 'done' : '') + ' ' + (isToday ? 'today' : '') + '">' +
        '<div class="cal-day-label">' + dayLabel + '</div>' +
        '<div class="cal-day-dot">' + (done ? '✓' : d.getDate()) + '</div>' +
      '</div>');
    }
    cal.innerHTML = '<div class="cal-row">' + days.join('') + '</div>';
  }

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

  var BADGES = [
    { id: 'newcomer', name: '初来乍到', icon: '🌟', desc: '注册账号', condition: function() { return true; } },
    { id: 'first_post', name: '初次发声', icon: '📝', desc: '发布第一篇帖子', condition: function(s) { return s.posts >= 1; } },
    { id: 'first_oc', name: '造物主', icon: '🧑‍🎨', desc: '创建第一个 OC', condition: function(s) { return s.ocs >= 1; } },
    { id: 'social', name: '社交蝴蝶', icon: '🦋', desc: '回复 10+ 帖子', condition: function(s) { return s.replies >= 10; } },
    { id: 'liked', name: '人气之星', icon: '⭐', desc: '累计获得 10 赞', condition: function(s) { return s.likes >= 10; } },
    { id: 'creator', name: '创作达人', icon: '🎨', desc: '发布 5+ 帖子', condition: function(s) { return s.posts >= 5; } },
    { id: 'oc_master', name: 'OC 大师', icon: '🏆', desc: '创建 3+ OC', condition: function(s) { return s.ocs >= 3; } },
    { id: 'veteran', name: '社区老兵', icon: '🏛️', desc: '达到 Lv.5', condition: function(s) { return s.level >= 5; } }
  ];

  function calcLevel(exp) {
    var current = LEVELS[0];
    var next = LEVELS[1];
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (exp >= LEVELS[i].exp) {
        current = LEVELS[i];
        next = LEVELS[i + 1] || LEVELS[i];
        break;
      }
    }
    var progress = next.exp > current.exp
      ? ((exp - current.exp) / (next.exp - current.exp)) * 100
      : 100;
    return { current: current, next: next, progress: Math.min(progress, 100) };
  }

  async function renderProfile() {
    try {
      var profileData = await apiGet('/api/profile');
      if (!profileData) return;

      var stats = profileData.stats || { posts: 0, replies: 0, likes: 0, ocs: 0 };
      var exp = profileData.exp || 0;
      var levelInfo = calcLevel(exp);

      var avatarEl = document.getElementById('profileAvatar');
      if (profileData.avatar) {
        avatarEl.innerHTML = '<img src="' + profileData.avatar + '" alt="' + escapeForumHtml(profileData.username || '') + '" loading="lazy">';
      } else {
        avatarEl.textContent = (profileData.username || '荣')[0];
      }

      document.getElementById('profileName').textContent = profileData.username || '荣耀玩家';
      if (isAdmin()) {
        document.getElementById('profileName').innerHTML = escapeForumHtml(profileData.username || '管理员') + ' <span style="background:#6a1b9a;color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:6px;vertical-align:middle;">管理员</span>';
      }
      document.getElementById('profileTitle').textContent = levelInfo.current.name;
      document.getElementById('profileJoinDate').textContent = profileData.joinDate || '2026-05-01';

      document.getElementById('levelBadge').textContent = 'Lv.' + levelInfo.current.level;
      document.getElementById('levelName').textContent = levelInfo.current.name;
      document.getElementById('levelProgressFill').style.width = levelInfo.progress + '%';
      document.getElementById('currentExp').textContent = exp;
      document.getElementById('nextLevelExp').textContent = levelInfo.next.exp;

      document.getElementById('statPosts').textContent = stats.posts;
      document.getElementById('statReplies').textContent = stats.replies;
      document.getElementById('statLikes').textContent = stats.likes;
      document.getElementById('statOCs').textContent = stats.ocs;

      document.getElementById('badgesGrid').innerHTML = BADGES.map(function(b) {
        var unlocked = b.condition(stats);
        return '<div class="badge-item ' + (unlocked ? 'unlocked' : 'locked') + '" title="' + b.desc + '">' +
          '<div class="badge-icon">' + b.icon + '</div>' +
          '<div class="badge-name">' + b.name + '</div>' +
        '</div>';
      }).join('');

      document.getElementById('levelTable').innerHTML = LEVELS.map(function(l) {
        return '<div class="level-row ' + (l.level <= levelInfo.current.level ? 'reached' : '') + '">' +
          '<span class="level-row-badge">Lv.' + l.level + '</span>' +
          '<span class="level-row-name">' + l.name + '</span>' +
          '<span class="level-row-exp">' + l.exp + ' EXP</span>' +
        '</div>';
      }).join('');

      renderMyPosts();
      renderMyOCs();
      renderCheckin();

      if (isAdmin()) {
        var btn = document.getElementById('adminAnnounceBtn');
        if (btn) btn.style.display = 'inline-block';
      }
    } catch (e) {
      console.error('renderProfile error:', e);
      showToast('加载失败，请刷新重试', 'error');
    }
  }

  async function renderMyPosts() {
    try {
      var user = getUser();
      if (!user) return;
      var result = await getPostsByAuthor(user.email);
      // 客户端二次过滤，确保只显示当前用户的帖子
      var myPosts = (result.items || []).filter(function(p) {
        return p.authorId && user.email && p.authorId.toLowerCase() === user.email.toLowerCase();
      });
      var container = document.getElementById('myPosts');

      if (myPosts.length === 0) {
        container.innerHTML = '<div class="empty-state">' +
          '<div style="font-size:36px;margin-bottom:12px;">📝</div>' +
          '<p>还没有发过帖子</p>' +
          '<a href="post-new.html" class="btn btn-primary" style="margin-top:12px;">去发一帖</a>' +
        '</div>';
        return;
      }

      container.innerHTML = myPosts.map(function(post) {
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
      document.getElementById('myPosts').innerHTML = '<p style="color:var(--text-3);padding:20px 0;">加载失败</p>';
    }
  }

  async function renderMyOCs() {
    try {
      var allOCs = await getAllOCs();
      var user = getUser();
      var myOCs = allOCs.filter(function(o) { return user && o.creatorId === user.email; })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      var container = document.getElementById('myOCs');

      if (myOCs.length === 0) {
        container.innerHTML = '<div class="empty-state">' +
          '<div style="font-size:36px;margin-bottom:12px;">🧑‍🎨</div>' +
          '<p>还没有创建 OC</p>' +
          '<a href="oc-create.html" class="btn btn-primary" style="margin-top:12px;">创建 OC</a>' +
        '</div>';
        return;
      }

      container.innerHTML = '<div class="oc-grid">' + myOCs.map(function(oc) {
        return '<a class="oc-card" href="oc-detail.html?id=' + oc.id + '">' +
          '<div class="oc-card-top"></div>' +
          '<div class="oc-card-body">' +
            '<div class="oc-avatar">' + (oc.avatar ? '<img src="' + oc.avatar + '" alt="' + escapeForumHtml(oc.name) + '" loading="lazy">' : escapeForumHtml(oc.gameId)) + '</div>' +
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
      document.getElementById('myOCs').innerHTML = '<p style="color:var(--text-3);padding:20px 0;">加载失败</p>';
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

  renderProfile();
})();
