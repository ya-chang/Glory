/* ===== oc-edit.html 页面逻辑 ===== */
(function() {
  var params = new URLSearchParams(window.location.search);
  var ocId = params.get('id');
  var oc = null;

  async function init() {
    oc = await getOCById(ocId);
    if (!oc) {
      document.querySelector('.container').style.display = 'none';
      document.querySelector('.steps').style.display = 'none';
      document.getElementById('notFound').style.display = 'block';
      return;
    }
    document.getElementById('editSubtitle').textContent = '正在编辑：' + oc.name;
    initForm();
  }
  init();

  function initForm() {
    OC_CLASSES.forEach(function(c) {
      var opt = new Option(c, c);
      document.getElementById('f_class').appendChild(opt);
    });
    OC_TEAMS.forEach(function(t) {
      var opt = new Option(t, t);
      document.getElementById('f_team').appendChild(opt);
    });
    OC_ROLES.forEach(function(r) {
      var opt = new Option(r, r);
      document.getElementById('f_teamRole').appendChild(opt);
    });
    OC_COMBAT_STYLES.forEach(function(s) {
      var opt = new Option(s, s);
      document.getElementById('f_combatStyle').appendChild(opt);
    });

    document.getElementById('f_name').value = oc.name;
    document.getElementById('f_gameId').value = oc.gameId;
    document.getElementById('f_age').value = oc.age;
    document.querySelector('input[name="gender"][value="' + oc.gender + '"]').checked = true;
    document.getElementById('f_height').value = oc.height || '';
    document.getElementById('f_birthday').value = oc.birthday || '';
    document.getElementById('f_appearance').value = oc.appearance;
    document.getElementById('f_personality').value = oc.personality;
    document.getElementById('f_class').value = oc.class;
    document.getElementById('f_weapon').value = oc.weapon;
    document.getElementById('f_weaponType').value = oc.weaponType;
    document.getElementById('f_weaponDesc').value = oc.weaponDesc;
    document.getElementById('f_combatStyle').value = oc.combatStyle;
    document.getElementById('f_customSkill').value = oc.customSkill || '';
    document.getElementById('f_team').value = oc.team;
    document.getElementById('f_teamRole').value = oc.teamRole;

    var skillInputs = document.querySelectorAll('.skill-input');
    oc.signatureSkills.forEach(function(s, i) {
      if (skillInputs[i]) skillInputs[i].value = s;
    });

    document.getElementById('f_bio').value = oc.bio;

    if (oc.avatar) {
      document.querySelector('#avatarPreview img').src = oc.avatar;
      document.getElementById('avatarPreview').style.display = 'block';
    }
    if (oc.illustration) {
      document.querySelector('#illustPreview img').src = oc.illustration;
      document.getElementById('illustPreview').style.display = 'block';
    }

    var container = document.getElementById('relationInputs');
    container.innerHTML = '';
    if (oc.relationships && oc.relationships.length > 0) {
      oc.relationships.forEach(function(r) {
        var row = document.createElement('div');
        row.className = 'relation-row';
        row.innerHTML = '<div class="form-group" style="margin-bottom:0;"><input type="text" placeholder="角色名" value="' + escapeAttr(r.name) + '"></div>' +
          '<div class="form-group" style="margin-bottom:0;"><input type="text" placeholder="关系描述" value="' + escapeAttr(r.desc) + '"></div>' +
          '<button class="btn-remove" onclick="this.parentElement.remove()">删除</button>';
        container.appendChild(row);
      });
    }
  }

  var currentStep = 1;

  window.goStep = function(n) {
    if (n > currentStep && !validateStep(currentStep)) return;
    document.getElementById('form' + currentStep).style.display = 'none';
    document.getElementById('form' + n).style.display = 'block';
    for (var i = 1; i <= 3; i++) {
      var el = document.getElementById('step' + i);
      el.className = 'step';
      if (i < n) el.className = 'step done';
      if (i === n) el.className = 'step active';
    }
    for (var j = 1; j <= 2; j++) {
      document.getElementById('line' + j).className = j < n ? 'step-line done' : 'step-line';
    }
    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function validateStep(step) {
    if (step === 1) {
      if (!document.getElementById('f_name').value.trim()) { alert('请填写角色名'); return false; }
      if (!document.getElementById('f_gameId').value.trim()) { alert('请填写游戏ID'); return false; }
      if (!document.getElementById('f_age').value) { alert('请填写年龄'); return false; }
      if (!document.querySelector('input[name="gender"]:checked')) { alert('请选择性别'); return false; }
      return true;
    }
    if (step === 2) {
      if (!document.getElementById('f_class').value) { alert('请选择职业'); return false; }
      if (!document.getElementById('f_weapon').value.trim()) { alert('请填写武器名称'); return false; }
      if (!document.getElementById('f_weaponDesc').value.trim()) { alert('请填写武器描述'); return false; }
      if (!document.getElementById('f_combatStyle').value) { alert('请选择战斗风格'); return false; }
      if (getSkills().length === 0) { alert('至少填写 1 个标志技能'); return false; }
      if (!document.getElementById('f_team').value) { alert('请选择战队'); return false; }
      if (!document.getElementById('f_teamRole').value) { alert('请选择职位'); return false; }
      return true;
    }
    return true;
  }

  function getSkills() {
    return Array.from(document.querySelectorAll('.skill-input'))
      .map(function(i) { return i.value.trim(); }).filter(function(v) { return v; });
  }

  function getRelations() {
    var rows = document.querySelectorAll('#relationInputs .relation-row');
    var rels = [];
    rows.forEach(function(row) {
      var inputs = row.querySelectorAll('input');
      var name = inputs[0].value.trim();
      var desc = inputs[1].value.trim();
      if (name && desc) rels.push({ name: name, desc: desc });
    });
    return rels;
  }

  window.addRelation = function() {
    var container = document.getElementById('relationInputs');
    if (container.children.length >= 10) { alert('最多 10 条'); return; }
    var row = document.createElement('div');
    row.className = 'relation-row';
    row.innerHTML = '<div class="form-group" style="margin-bottom:0;"><input type="text" placeholder="角色名"></div>' +
      '<div class="form-group" style="margin-bottom:0;"><input type="text" placeholder="关系描述"></div>' +
      '<button class="btn-remove" onclick="this.parentElement.remove()">删除</button>';
    container.appendChild(row);
  };

  window.previewFile = function(input, previewId) {
    var preview = document.getElementById(previewId);
    var file = input.files[0];
    if (!file) { preview.style.display = 'none'; return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      preview.querySelector('img').src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  };

  window.saveOC = async function() {
    if (!validateStep(2)) return;
    var avatarPreview = document.querySelector('#avatarPreview img');
    var illustPreview = document.querySelector('#illustPreview img');
    var data = {
      name: document.getElementById('f_name').value.trim(),
      gameId: document.getElementById('f_gameId').value.trim(),
      avatar: (avatarPreview && avatarPreview.src && document.getElementById('avatarPreview').style.display !== 'none') ? avatarPreview.src : oc.avatar,
      illustration: (illustPreview && illustPreview.src && document.getElementById('illustPreview').style.display !== 'none') ? illustPreview.src : oc.illustration,
      age: parseInt(document.getElementById('f_age').value),
      gender: document.querySelector('input[name="gender"]:checked').value,
      height: document.getElementById('f_height').value.trim(),
      birthday: document.getElementById('f_birthday').value.trim(),
      appearance: document.getElementById('f_appearance').value.trim(),
      personality: document.getElementById('f_personality').value.trim(),
      class: document.getElementById('f_class').value,
      weapon: document.getElementById('f_weapon').value.trim(),
      weaponType: document.getElementById('f_weaponType').value,
      weaponDesc: document.getElementById('f_weaponDesc').value.trim(),
      combatStyle: document.getElementById('f_combatStyle').value,
      signatureSkills: getSkills(),
      customSkill: document.getElementById('f_customSkill').value.trim(),
      team: document.getElementById('f_team').value,
      teamRole: document.getElementById('f_teamRole').value,
      bio: document.getElementById('f_bio').value.trim(),
      relationships: getRelations()
    };
    try {
      await updateOC(ocId, data);
      alert('修改已保存！');
      window.location.href = 'oc-detail.html?id=' + ocId;
    } catch (e) {
      alert('保存失败：' + e.message);
    }
  };

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
