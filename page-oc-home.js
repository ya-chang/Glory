/* ===== oc-home.html 页面逻辑 ===== */
(function() {
  var classSelect = document.getElementById('classFilter');
  OC_CLASSES.forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    classSelect.appendChild(opt);
  });

  function renderAvatar(oc) {
    if (oc.avatar) {
      return '<img src="' + oc.avatar + '" alt="' + escapeForumHtml(oc.name) + '">';
    }
    return escapeForumHtml(oc.gameId);
  }

  async function renderList() {
    var search = document.getElementById('searchInput').value.trim();
    var ocClass = document.getElementById('classFilter').value;
    var grid = document.getElementById('ocGrid');
    var empty = document.getElementById('emptyState');
    var loading = document.getElementById('loadingState');
    var createBtn = document.getElementById('createBtn');

    grid.innerHTML = '';
    loading.style.display = 'block';

    try {
      var result = await filterOCs({ search: search, ocClass: ocClass });
      var list = result.items || [];

      loading.style.display = 'none';

      if (list.length === 0) {
        empty.style.display = 'block';
        createBtn.style.display = 'none';
        return;
      }

      empty.style.display = 'none';
      createBtn.style.display = 'inline-block';

      list.forEach(function(oc) {
        var card = renderOCCard(oc);
        grid.appendChild(card);
      });
    } catch (e) {
      loading.style.display = 'none';
      showErrorState('ocGrid', '加载失败', function() { renderList(); });
    }
  }

  // 检查草稿
  var DRAFT_KEY = 'glory_oc_draft';
  try {
    var draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      var d = JSON.parse(draft);
      if (d.name || d.gameId) {
        document.getElementById('draftBanner').style.display = 'flex';
      }
    }
  } catch (e) {}

  window.clearDraftBanner = function() {
    localStorage.removeItem(DRAFT_KEY);
    document.getElementById('draftBanner').style.display = 'none';
  };

  renderList();
})();
