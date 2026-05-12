/* ===== player-detail.html 页面逻辑 ===== */
(function() {
  var params = new URLSearchParams(window.location.search);
  var playerId = params.get('id');
  var player = PLAYERS.find(function(p) { return p.id === playerId; });

  if (!player) {
    document.getElementById('detailHero').innerHTML = '<div class="container" style="text-align:center;padding:60px 0;">' +
      '<div style="font-size:64px;margin-bottom:16px;">😢</div>' +
      '<h2 style="color:var(--white);">未找到该选手</h2>' +
      '<a href="players.html" style="color:rgba(255,255,255,0.7);margin-top:12px;display:inline-block;">← 返回选手列表</a>' +
    '</div>';
    document.querySelector('.detail-body').style.display = 'none';
    return;
  }

  document.title = player.name + ' · 选手档案 · 荣耀社区';
  document.getElementById('detailAvatar').textContent = player.avatar;
  document.getElementById('detailName').textContent = player.name;
  document.getElementById('detailSub').textContent = player.gameId + ' · ' + player.team.split('→').pop();
  document.getElementById('detailTags').innerHTML =
    '<span class="tag">' + player.class.split('/')[0] + '</span>' +
    '<span class="tag">' + player.role + '</span>' +
    '<span class="tag">' + player.status + '</span>';
  document.getElementById('detailBio').textContent = player.bio;

  var infoRows = [['游戏ID',player.gameId],['职业',player.class],['武器',player.weapon],['战队',player.team],['职位',player.role],['出道赛季','S' + player.debutSeason],['生日',player.birthday],['身高',player.height],['血型',player.blood]];
  document.getElementById('detailInfo').innerHTML = infoRows.map(function(row) { return '<div class="info-row"><span class="label">' + row[0] + '</span><span class="value">' + row[1] + '</span></div>'; }).join('');

  document.getElementById('detailCareer').innerHTML = player.career.map(function(c) { return '<div class="career-item' + (c.h ? ' highlight' : '') + '"><div class="season">' + c.s + '</div><div class="detail">' + c.d + '</div></div>'; }).join('');

  if (player.honors.length) {
    document.getElementById('honorsCard').style.display = 'block';
    document.getElementById('detailHonors').innerHTML = player.honors.map(function(h) { return '<span class="honor-badge">🏅 ' + h + '</span>'; }).join('');
  }

  if (player.relationships.length) {
    document.getElementById('relationsCard').style.display = 'block';
    document.getElementById('detailRelations').innerHTML = player.relationships.map(function(r) {
      var rel = PLAYERS.find(function(p) { return p.name === r.name; });
      var av = rel ? rel.avatar : r.name[0];
      var href = rel ? 'player-detail.html?id=' + rel.id : '#';
      return '<a class="relation-item" href="' + href + '"><div class="relation-avatar">' + av + '</div><div class="relation-info"><div class="name">' + r.name + '</div><div class="desc">' + r.desc + '</div></div></a>';
    }).join('');
  }
})();
