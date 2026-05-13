/* ===== teams.html 页面逻辑 ===== */
(function() {
  var playerIdMap = {};
  PLAYERS_INDEX.forEach(function(p) { playerIdMap[p.name] = p.id; });

  var currentSeason = 9;

  function renderSeasonTabs() {
    var container = document.getElementById('seasonTabs');
    for (var s = 1; s <= 10; s++) {
      (function(season) {
        var tab = document.createElement('span');
        tab.className = 'season-tab' + (season === currentSeason ? ' active' : '');
        tab.textContent = 'S' + season;
        tab.dataset.season = season;
        tab.onclick = function() {
          document.querySelectorAll('.season-tab').forEach(function(el) { el.classList.remove('active'); });
          tab.classList.add('active');
          currentSeason = season;
          renderTeams();
        };
        container.appendChild(tab);
      })(s);
    }
  }

  function renderTeams() {
    var container = document.getElementById('teamsContainer');
    container.innerHTML = '';

    TEAM_ORDER.forEach(function(teamId) {
      var team = TEAM_ROSTERS[teamId];
      if (!team) return;

      var roster = team.seasons[currentSeason] || [];
      var card = document.createElement('div');
      card.className = 'team-card';

      var rosterHtml = '';
      if (roster.length === 0) {
        rosterHtml = '<div class="team-empty">该赛季暂无阵容数据</div>';
      } else {
        rosterHtml = '<div class="team-roster">' + roster.map(function(p, i) {
          var noteHtml = p.note ? '<span class="player-note">' + p.note + '</span>' : '';
          var pid = playerIdMap[p.name];
          var nameHtml = pid
            ? '<a class="roster-name roster-link" href="player-detail.html?id=' + pid + '">' + p.name + '</a>'
            : '<span class="roster-name">' + p.name + '</span>';
          return '<div class="roster-row">' +
            '<span class="roster-num">' + (i + 1) + '</span>' +
            nameHtml +
            '<span class="roster-role">' + p.role + '</span>' +
            noteHtml +
            '</div>';
        }).join('') + '</div>';
      }

      card.innerHTML = '<div class="team-header">' +
        '<h2>' + team.fullName + '</h2>' +
        '<span class="team-count">' + roster.length + ' 人</span>' +
      '</div>' + rosterHtml;

      container.appendChild(card);
    });
  }

  renderSeasonTabs();
  renderTeams();
})();
