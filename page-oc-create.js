/* ===== oc-create.html 页面逻辑 ===== */
(function() {
  var classSelect = document.getElementById('f_class');
  OC_CLASSES.forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    classSelect.appendChild(opt);
  });

  var teamSelect = document.getElementById('f_team');
  OC_TEAMS.forEach(function(t) {
    var opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    teamSelect.appendChild(opt);
  });

  var roleSelect = document.getElementById('f_teamRole');
  OC_ROLES.forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r; opt.textContent = r;
    roleSelect.appendChild(opt);
  });

  var styleSelect = document.getElementById('f_combatStyle');
  OC_COMBAT_STYLES.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    styleSelect.appendChild(opt);
  });

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
      var line = document.getElementById('line' + j);
      line.className = j < n ? 'step-line done' : 'step-line';
    }
    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function validateStep(step) {
    if (step === 1) {
      var name = document.getElementById('f_name').value.trim();
      var gameId = document.getElementById('f_gameId').value.trim();
      var age = document.getElementById('f_age').value;
      var gender = document.querySelector('input[name="gender"]:checked');
      if (!name) { alert('请填写角色名'); return false; }
      if (!gameId) { alert('请填写游戏ID'); return false; }
      if (!age) { alert('请填写年龄'); return false; }
      if (!gender) { alert('请选择性别'); return false; }
      return true;
    }
    if (step === 2) {
      var ocClass = document.getElementById('f_class').value;
      var weapon = document.getElementById('f_weapon').value.trim();
      var weaponDesc = document.getElementById('f_weaponDesc').value.trim();
      var combatStyle = document.getElementById('f_combatStyle').value;
      var team = document.getElementById('f_team').value;
      var teamRole = document.getElementById('f_teamRole').value;
      var skills = getSkills();
      if (!ocClass) { alert('请选择职业'); return false; }
      if (!weapon) { alert('请填写武器名称'); return false; }
      if (!weaponDesc) { alert('请填写武器描述'); return false; }
      if (!combatStyle) { alert('请选择战斗风格'); return false; }
      if (skills.length === 0) { alert('至少填写 1 个标志技能'); return false; }
      if (!team) { alert('请选择战队'); return false; }
      if (!teamRole) { alert('请选择职位'); return false; }
      return true;
    }
    return true;
  }

  function getSkills() {
    return Array.from(document.querySelectorAll('.skill-input'))
      .map(function(input) { return input.value.trim(); })
      .filter(function(v) { return v; });
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
    if (container.children.length >= 10) { alert('最多 10 条人际关系'); return; }
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

  window.submitOC = async function() {
    if (!validateStep(2)) return;
    var avatarPreview = document.querySelector('#avatarPreview img');
    var illustPreview = document.querySelector('#illustPreview img');
    var data = {
      name: document.getElementById('f_name').value.trim(),
      gameId: document.getElementById('f_gameId').value.trim(),
      avatar: (avatarPreview && avatarPreview.src && document.getElementById('avatarPreview').style.display !== 'none') ? avatarPreview.src : '',
      illustration: (illustPreview && illustPreview.src && document.getElementById('illustPreview').style.display !== 'none') ? illustPreview.src : '',
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
      await createOC(data);
      clearDraft();
      alert('OC 创建成功！');
      window.location.href = 'oc-home.html';
    } catch (e) {
      alert('创建失败：' + e.message);
    }
  };

  var DRAFT_KEY = 'glory_oc_draft';

  function collectFormData() {
    return {
      name: document.getElementById('f_name').value,
      gameId: document.getElementById('f_gameId').value,
      age: document.getElementById('f_age').value,
      gender: (document.querySelector('input[name="gender"]:checked') || {}).value || '',
      height: document.getElementById('f_height').value,
      birthday: document.getElementById('f_birthday').value,
      appearance: document.getElementById('f_appearance').value,
      personality: document.getElementById('f_personality').value,
      class: document.getElementById('f_class').value,
      weapon: document.getElementById('f_weapon').value,
      weaponType: document.getElementById('f_weaponType').value,
      weaponDesc: document.getElementById('f_weaponDesc').value,
      combatStyle: document.getElementById('f_combatStyle').value,
      skills: getSkills(),
      customSkill: document.getElementById('f_customSkill').value,
      team: document.getElementById('f_team').value,
      teamRole: document.getElementById('f_teamRole').value,
      bio: document.getElementById('f_bio').value,
      relationships: getRelations()
    };
  }

  window.saveDraft = function() {
    var data = collectFormData();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    alert('草稿已保存');
  };

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d.name) document.getElementById('f_name').value = d.name;
      if (d.gameId) document.getElementById('f_gameId').value = d.gameId;
      if (d.age) document.getElementById('f_age').value = d.age;
      if (d.gender) document.querySelector('input[name="gender"][value="' + d.gender + '"]').checked = true;
      if (d.height) document.getElementById('f_height').value = d.height;
      if (d.birthday) document.getElementById('f_birthday').value = d.birthday;
      if (d.appearance) document.getElementById('f_appearance').value = d.appearance;
      if (d.personality) document.getElementById('f_personality').value = d.personality;
      if (d.class) document.getElementById('f_class').value = d.class;
      if (d.weapon) document.getElementById('f_weapon').value = d.weapon;
      if (d.weaponType) document.getElementById('f_weaponType').value = d.weaponType;
      if (d.weaponDesc) document.getElementById('f_weaponDesc').value = d.weaponDesc;
      if (d.combatStyle) document.getElementById('f_combatStyle').value = d.combatStyle;
      if (d.customSkill) document.getElementById('f_customSkill').value = d.customSkill;
      if (d.team) document.getElementById('f_team').value = d.team;
      if (d.teamRole) document.getElementById('f_teamRole').value = d.teamRole;
      if (d.bio) document.getElementById('f_bio').value = d.bio;
      if (d.skills) {
        var inputs = document.querySelectorAll('.skill-input');
        d.skills.forEach(function(s, i) { if (inputs[i]) inputs[i].value = s; });
      }
      if (d.relationships && d.relationships.length > 0) {
        var container = document.getElementById('relationInputs');
        container.innerHTML = '';
        d.relationships.forEach(function(r) {
          var row = document.createElement('div');
          row.className = 'relation-row';
          row.innerHTML = '<div class="form-group" style="margin-bottom:0;"><input type="text" placeholder="角色名" value="' + escapeAttr(r.name) + '"></div>' +
            '<div class="form-group" style="margin-bottom:0;"><input type="text" placeholder="关系描述" value="' + escapeAttr(r.desc) + '"></div>' +
            '<button class="btn-remove" onclick="this.parentElement.remove()">删除</button>';
          container.appendChild(row);
        });
      }
    } catch (e) {}
  }

  function clearDraft() { localStorage.removeItem(DRAFT_KEY); }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  loadDraft();
})();
