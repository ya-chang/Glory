/* ===== oc-detail.html 页面逻辑 ===== */
(function() {
  var COMMENT_KEY = 'glory_oc_comments';
  var params = new URLSearchParams(window.location.search);
  var ocId = params.get('id');
  var oc = null;

  async function init() {
    oc = await getOCById(ocId);
    if (!oc) {
      document.getElementById('heroSection').style.display = 'none';
      document.getElementById('detailBody').style.display = 'none';
      document.getElementById('notFound').style.display = 'block';
      return;
    }
    document.title = oc.name + ' · OC 详情 · 荣耀社区';
    renderDetail();
  }

  function renderDetail() {
    var avatarEl = document.getElementById('detailAvatar');
    if (oc.avatar) {
      avatarEl.innerHTML = '<img src="' + oc.avatar + '" alt="' + escapeForumHtml(oc.name) + '">';
    } else {
      avatarEl.textContent = oc.gameId;
    }

    document.getElementById('detailName').textContent = oc.name;
    document.getElementById('detailSub').innerHTML = escapeForumHtml(oc.gameId) + ' · 创建者：<a href="user.html?email=' + encodeURIComponent(oc.creatorId) + '" class="user-link">' + escapeForumHtml(oc.creatorName || '匿名') + '</a>';

    document.getElementById('detailTags').innerHTML =
      '<span class="tag">' + escapeForumHtml(oc.class) + '</span>' +
      '<span class="tag">' + escapeForumHtml(oc.team) + '</span>' +
      '<span class="tag">' + escapeForumHtml(oc.teamRole) + '</span>';

    var user = getUser();
    var isOwner = user && user.email === oc.creatorId;
    document.getElementById('detailActions').innerHTML = isOwner ?
      '<a href="oc-edit.html?id=' + oc.id + '" class="btn btn-secondary" style="padding:6px 16px;font-size:13px;">编辑</a>' +
      '<button class="btn btn-danger" style="padding:6px 16px;font-size:13px;" onclick="deleteOCConfirm()">删除</button>' : '';

    if (oc.illustration) {
      document.getElementById('illustrationWrap').style.display = 'block';
      document.getElementById('illustrationWrap').innerHTML =
        '<div class="oc-illustration"><img src="' + oc.illustration + '" alt="' + escapeForumHtml(oc.name) + ' 立绘"></div>';
    }

    if (oc.bio) {
      document.getElementById('detailBio').textContent = oc.bio;
    } else {
      document.getElementById('detailBio').parentElement.style.display = 'none';
    }

    var gloryRows = [
      ['职业', oc.class],
      ['武器', oc.weapon + '（' + oc.weaponType + '）'],
      ['武器描述', oc.weaponDesc],
      ['战斗风格', oc.combatStyle],
      ['标志技能', (oc.signatureSkills || []).join('、')],
      ['自创技能', oc.customSkill || '—'],
      ['所属战队', oc.team],
      ['职位', oc.teamRole]
    ];
    document.getElementById('detailGlory').innerHTML = gloryRows
      .filter(function(row) { return row[1] && row[1] !== '—'; })
      .map(function(row) { return '<div class="info-row"><span class="label">' + row[0] + '</span><span class="value">' + row[1] + '</span></div>'; })
      .join('');

    var infoRows = [
      ['角色名', oc.name],
      ['游戏ID', oc.gameId],
      ['年龄', oc.age],
      ['性别', genderText(oc.gender)],
      ['身高', oc.height],
      ['生日', oc.birthday],
      ['外貌', oc.appearance],
      ['性格', oc.personality]
    ];
    document.getElementById('detailInfo').innerHTML = infoRows
      .filter(function(row) { return row[1]; })
      .map(function(row) { return '<div class="info-row"><span class="label">' + row[0] + '</span><span class="value">' + row[1] + '</span></div>'; })
      .join('');

    if (oc.relationships && oc.relationships.length > 0) {
      document.getElementById('relationsCard').style.display = 'block';
      document.getElementById('detailRelations').innerHTML = oc.relationships.map(function(r) {
        return '<div class="relation-item">' +
          '<div class="relation-avatar">' + r.name[0] + '</div>' +
          '<div class="relation-info"><div class="name">' + escapeForumHtml(r.name) + '</div><div class="desc">' + escapeForumHtml(r.desc) + '</div></div>' +
        '</div>';
      }).join('');
    }

    renderComments();
  }

  function getComments() {
    try {
      var data = localStorage.getItem(COMMENT_KEY);
      var all = data ? JSON.parse(data) : {};
      return all[ocId] || [];
    } catch (e) { return []; }
  }

  function saveComments(list) {
    try {
      var data = localStorage.getItem(COMMENT_KEY);
      var all = data ? JSON.parse(data) : {};
      all[ocId] = list;
      localStorage.setItem(COMMENT_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  function renderComments() {
    var comments = getComments();
    document.getElementById('commentTitle').textContent = '评论（' + comments.length + '）';
    var list = document.getElementById('commentsList');
    if (comments.length === 0) {
      list.innerHTML = '<p style="font-size:13px;color:var(--text-3);padding:16px 0;">暂无评论</p>';
      return;
    }
    list.innerHTML = comments.map(function(c) {
      return '<div class="comment">' +
        '<div class="comment-avatar">' + c.author[0] + '</div>' +
        '<div class="comment-body">' +
          '<div class="comment-header"><span class="author">' + escapeForumHtml(c.author) + '</span> · ' + forumTimeAgo(c.time) + '</div>' +
          '<div class="comment-text">' + escapeForumHtml(c.text) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  window.addComment = function() {
    var input = document.getElementById('commentInput');
    var text = input.value.trim();
    if (!text) return;
    var user = getUser();
    var author = user ? user.username : '匿名用户';
    var comments = getComments();
    comments.push({ author: author, text: text, time: new Date().toISOString() });
    saveComments(comments);
    input.value = '';
    renderComments();
  };

  window.deleteOCConfirm = async function() {
    if (confirm('确定删除这个 OC 吗？此操作不可恢复。')) {
      try {
        await deleteOC(ocId);
        window.location.href = 'oc-home.html';
      } catch (e) {
        alert('删除失败：' + e.message);
      }
    }
  };

  init();
})();
