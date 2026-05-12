/* ===== post-new.html 页面逻辑 ===== */
(function() {
  // 检查登录状态 + 规则弹窗
  if (!getToken()) {
    alert('请先登录后再发帖');
    window.location.href = 'index.html';
    return;
  }

  // 首次发帖显示规则弹窗
  showRulesModal();

  var selectedCategory = '';
  var isAnnounce = false;

  var categoryGrid = document.getElementById('categoryGrid');
  FORUM_CATEGORIES.forEach(function(c) {
    var card = document.createElement('div');
    card.className = 'cat-select-card';
    card.dataset.id = c.id;
    card.innerHTML = '<span class="cat-select-icon">' + c.icon + '</span><span class="cat-select-name">' + c.name + '</span>';
    card.onclick = function() {
      document.querySelectorAll('.cat-select-card').forEach(function(el) { el.classList.remove('selected'); });
      card.classList.add('selected');
      selectedCategory = c.id;
    };
    categoryGrid.appendChild(card);
  });

  var params = new URLSearchParams(window.location.search);
  var preCat = params.get('cat');
  if (preCat) {
    var target = document.querySelector('.cat-select-card[data-id="' + preCat + '"]');
    if (target) { target.click(); }
  }

  // 管理员发布公告模式
  isAnnounce = params.get('announce') === '1';
  if (isAnnounce && isAdmin()) {
    document.querySelector('h1').textContent = '📢 发布公告';
    document.querySelector('.page-header p').textContent = '发布公告将自动置顶到站务中心';
    document.title = '发布公告 · 荣耀社区';
    var metaCard = document.querySelector('.cat-select-card[data-id="meta"]');
    if (metaCard) { metaCard.click(); metaCard.style.display = 'none'; }
  }

  var tags = [];
  var tagInput = document.getElementById('tagInput');
  var tagWrap = document.getElementById('tagInputWrap');

  tagInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var val = this.value.trim();
      if (!val) return;
      if (tags.length >= 5) { alert('最多 5 个标签'); return; }
      if (tags.indexOf(val) !== -1) { alert('标签已存在'); return; }
      tags.push(val);
      this.value = '';
      renderTags();
    }
    if (e.key === 'Backspace' && !this.value && tags.length > 0) {
      tags.pop();
      renderTags();
    }
  });

  function renderTags() {
    tagWrap.querySelectorAll('.tag-chip').forEach(function(el) { el.remove(); });
    tags.forEach(function(tag, i) {
      var chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = escapeForumHtml(tag) + ' <span class="remove-tag" onclick="removeTag(' + i + ')">✕</span>';
      tagWrap.insertBefore(chip, tagInput);
    });
  }

  window.removeTag = function(index) {
    tags.splice(index, 1);
    renderTags();
  };

  window.addSuggestedTag = function(tag) {
    if (tags.length >= 5) { alert('最多 5 个标签'); return; }
    if (tags.indexOf(tag) !== -1) return;
    tags.push(tag);
    renderTags();
  };

  window.insertFormat = function(before, after) {
    var textarea = document.getElementById('f_content');
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var selected = textarea.value.substring(start, end);
    textarea.value = textarea.value.substring(0, start) + before + selected + after + textarea.value.substring(end);
    textarea.focus();
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selected.length;
  };

  window.uploadPostImage = async function(input) {
    var file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('请选择图片文件'); input.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { alert('图片过大，请选择 10MB 以内'); input.value = ''; return; }

    showToast('正在上传图片...');
    try {
      var url = await compressAndUpload(file, 1200, 0.85);
      var textarea = document.getElementById('f_content');
      var imgMarkdown = '\n![图片](' + url + ')\n';
      var pos = textarea.selectionStart;
      textarea.value = textarea.value.substring(0, pos) + imgMarkdown + textarea.value.substring(pos);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = pos + imgMarkdown.length;
      updateCharCount();
      showToast('图片上传成功 ✅', 'success');
    } catch (e) {
      alert('图片上传失败，请重试');
    }
    input.value = '';
  };

  window.updateCharCount = function() {
    document.getElementById('titleCount').textContent = document.getElementById('f_title').value.length;
    document.getElementById('contentCount').textContent = document.getElementById('f_content').value.length;
  };

  window.openPreview = function() {
    var title = document.getElementById('f_title').value.trim();
    var content = document.getElementById('f_content').value.trim();
    if (!title && !content) { alert('请先填写标题和内容'); return; }

    document.getElementById('previewTitle').textContent = title || '(无标题)';
    document.getElementById('previewContent').innerHTML = formatPostContent(content || '(无内容)');
    document.getElementById('previewTags').innerHTML = tags.length > 0
      ? '<div class="post-tags" style="margin-top:12px;">' + tags.map(function(t) { return '<span class="post-tag">' + escapeForumHtml(t) + '</span>'; }).join('') + '</div>'
      : '';
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
  };

  window.closePreview = function() {
    document.getElementById('previewSection').style.display = 'none';
  };

  window.submitPost = async function() {
    if (!selectedCategory) { alert('请选择版块'); return; }
    var title = document.getElementById('f_title').value.trim();
    var content = document.getElementById('f_content').value.trim();
    if (!title) { alert('请输入标题'); return; }
    if (!content) { alert('请输入内容'); return; }
    if (title.length > 100) { alert('标题不能超过 100 字'); return; }

    var btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = '发布中...';

    try {
      if (isAnnounce && isAdmin() && selectedCategory === 'meta') {
        var result = await apiPost('/api/admin/announcements', { title: title, content: content });
        if (!result) throw new Error('发布失败');
        alert('公告发布成功！');
        window.location.href = 'post-detail.html?id=' + result.id;
        return;
      }

      var post = await createPost({
        title: title,
        content: content,
        category: selectedCategory,
        tags: tags.slice()
      });
      alert('帖子发布成功！');
      window.location.href = 'post-detail.html?id=' + post.id;
    } catch (e) {
      alert('发布失败：' + e.message);
      btn.disabled = false;
      btn.textContent = '📤 发布帖子';
    }
  };
})();
