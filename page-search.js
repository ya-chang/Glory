/* ===== search.html 页面逻辑 ===== */
(function() {
  var currentFilter = 'all';
  var lastQuery = '';

  var urlParams = new URLSearchParams(window.location.search);
  var initQuery = urlParams.get('q') || '';
  if (initQuery) {
    document.getElementById('searchInput').value = initQuery;
    doSearch();
  }

  window.setFilter = function(filter) {
    currentFilter = filter;
    document.querySelectorAll('.search-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.filter === filter);
    });
    if (lastQuery) doSearch();
  };

  async function doSearch(e) {
    if (e) e.preventDefault();
    var query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    lastQuery = query;

    var url = new URL(window.location);
    url.searchParams.set('q', query);
    history.replaceState(null, '', url);

    var results = await searchAll(query);
    renderResults(results, query);
  }
  window.doSearch = doSearch;

  window.quickSearch = function(q) {
    document.getElementById('searchInput').value = q;
    doSearch();
  };

  async function searchAll(query) {
    var q = query.toLowerCase();
    var results = [];

    if (currentFilter === 'all' || currentFilter === 'player') {
      PLAYERS.forEach(function(p) {
        var score = matchScore(q, [p.name, p.gameId, p.class, p.team, p.bio || '', p.teamShort || '']);
        if (score > 0) {
          results.push({ type: 'player', score: score, data: p, title: p.name, subtitle: p.gameId.split('/')[0].trim(), meta: p.class.split('/')[0].split('（')[0] + ' · ' + p.team.split('→').pop() + ' · ' + p.status, link: 'player-detail.html?id=' + p.id, avatar: p.avatar });
        }
      });
    }

    if (currentFilter === 'all' || currentFilter === 'post') {
      try {
        var posts = await getAllPosts();
        posts.forEach(function(p) {
          var cat = getCategoryById(p.category);
          var catName = cat ? cat.name : '';
          var tagsStr = (p.tags || []).join(' ');
          var score = matchScore(q, [p.title, p.content, catName, tagsStr, p.authorName]);
          if (score > 0) {
            results.push({ type: 'post', score: score, data: p, title: p.title, subtitle: userLinkHtml(p.authorId, p.authorName), meta: (cat ? cat.icon + ' ' + cat.name : '') + ' · 💬' + p.replyCount + ' 👍' + p.likeCount, link: 'post-detail.html?id=' + p.id, excerpt: (p.content || '').slice(0, 120), isPinned: p.isPinned });
          }
        });
      } catch (e) { console.error('search posts error:', e); }
    }

    if (currentFilter === 'all' || currentFilter === 'oc') {
      try {
        var ocs = await getAllOCs();
        ocs.filter(function(oc) { return oc.status === 'active'; }).forEach(function(oc) {
          var score = matchScore(q, [oc.name, oc.gameId, oc.class, oc.team, oc.bio || '', oc.creatorName || '', oc.weapon || '', oc.combatStyle || '']);
          if (score > 0) {
            results.push({ type: 'oc', score: score, data: oc, title: oc.name, subtitle: oc.gameId, meta: oc.class + ' · ' + oc.team + ' · 创建者：' + (oc.creatorName || '匿名'), link: 'oc-detail.html?id=' + oc.id, avatar: oc.avatar });
          }
        });
      } catch (e) { console.error('search ocs error:', e); }
    }

    results.sort(function(a, b) { return b.score - a.score; });
    return results;
  }

  function matchScore(query, fields) {
    var score = 0;
    fields.forEach(function(field) {
      if (!field) return;
      var f = field.toLowerCase();
      if (f === query) { score += 100; }
      else if (f.includes(query)) { score += 50; }
      else {
        query.split(/\s+/).forEach(function(w) {
          if (w && f.includes(w)) score += 10;
        });
      }
    });
    return score;
  }

  function highlightText(text, query) {
    if (!text || !query) return escapeForumHtml(text || '');
    var escaped = escapeForumHtml(text);
    var q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp('(' + q + ')', 'gi'), '<mark>$1</mark>');
  }

  function renderResults(results, query) {
    var container = document.getElementById('searchResults');
    var statsEl = document.getElementById('searchStats');
    var emptyEl = document.getElementById('searchEmpty');
    var noResultEl = document.getElementById('searchNoResult');

    emptyEl.style.display = 'none';

    if (results.length === 0) {
      container.innerHTML = '';
      statsEl.style.display = 'none';
      noResultEl.style.display = 'block';
      return;
    }

    noResultEl.style.display = 'none';
    statsEl.style.display = 'block';
    document.getElementById('resultCount').textContent = results.length;

    var html = '';
    results.forEach(function(r) {
      html += '<a href="' + r.link + '" class="search-result-item search-result-' + r.type + '">';

      if (r.type === 'player') {
        html += '<div class="search-result-avatar player-avatar">' + r.avatar + '</div>';
      } else if (r.type === 'oc') {
        html += '<div class="search-result-avatar oc-avatar">' + (r.avatar ? '' : r.data.gameId[0]) + '</div>';
      } else {
        html += '<div class="search-result-avatar post-avatar">' + (r.isPinned ? '📌' : '💬') + '</div>';
      }

      html += '<div class="search-result-body">';
      var typeLabel = r.type === 'player' ? '👤 选手' : r.type === 'post' ? '💬 帖子' : '🧑‍🎨 OC';
      html += '<span class="search-result-type">' + typeLabel + '</span>';
      html += '<div class="search-result-title">' + highlightText(r.title, query) + '</div>';

      if (r.excerpt) {
        var clean = r.excerpt.replace(/\n/g, ' ');
        html += '<div class="search-result-excerpt">' + highlightText(clean, query) + '</div>';
      }

      html += '<div class="search-result-meta">';
      html += '<span class="search-result-sub">' + r.subtitle + '</span>';
      if (r.meta) html += '<span class="search-result-info">' + r.meta + '</span>';
      html += '</div></div></a>';
    });

    container.innerHTML = html;
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
  });
})();
