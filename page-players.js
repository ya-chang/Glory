/* ===== players.html 页面逻辑 ===== */
(function() {
  var currentTeam = 'all';

  function renderTabs() {
    var container = document.getElementById('teamTabs');
    TEAMS.forEach(function(t) {
      var tab = document.createElement('span');
      tab.className = 'team-tab' + (t.id === 'all' ? ' active' : '');
      tab.textContent = t.name;
      tab.dataset.id = t.id;
      tab.onclick = function() {
        document.querySelectorAll('.team-tab').forEach(function(el) { el.classList.remove('active'); });
        tab.classList.add('active');
        currentTeam = t.id;
        filterPlayers();
      };
      container.appendChild(tab);
    });
  }

  function renderCards(list) {
    var grid = document.getElementById('playersGrid');
    var empty = document.getElementById('emptyState');
    grid.innerHTML = '';
    if (list.length === 0) { empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    list.forEach(function(p) {
      var card = document.createElement('a');
      card.className = 'player-card';
      card.href = 'player-detail.html?id=' + p.id;
      var sc = p.status === '现役' ? 'tag-active' : (p.status === '退役' ? 'tag-retired' : 'tag-status');
      card.innerHTML = '<div class="player-card-top"></div>' +
        '<div class="player-card-body">' +
          '<div class="player-avatar">' + p.avatar + '</div>' +
          '<div class="player-info">' +
            '<h3>' + p.name + '</h3>' +
            '<div class="game-id">' + p.gameId.split('/')[0].trim() + '</div>' +
            '<div class="meta">' +
              '<span class="tag tag-class">' + p.class.split('/')[0].split('（')[0] + '</span>' +
              '<span class="tag tag-team">' + p.teamShort + '</span>' +
              '<span class="tag ' + sc + '">' + p.status + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  function filterPlayers() {
    var search = document.getElementById('searchInput').value.trim().toLowerCase();
    var status = document.getElementById('statusFilter').value;
    var list = PLAYERS;
    if (currentTeam !== 'all') list = list.filter(function(p) { return p.team.indexOf(currentTeam) !== -1 || p.teamShort === currentTeam; });
    if (status !== 'all') list = list.filter(function(p) { return p.status === status; });
    if (search) list = list.filter(function(p) { return p.name.toLowerCase().indexOf(search) !== -1 || p.gameId.toLowerCase().indexOf(search) !== -1 || p.class.toLowerCase().indexOf(search) !== -1 || p.team.toLowerCase().indexOf(search) !== -1 || p.honors.some(function(h) { return h.toLowerCase().indexOf(search) !== -1; }); });
    renderCards(list);
  }

  renderTabs();
  filterPlayers();

  // 暴露 filterPlayers 到全局，供 HTML oninput/onchange 属性调用
  window.filterPlayers = filterPlayers;
})();
