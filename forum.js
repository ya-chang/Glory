/* ===== 荣耀社区 - 讨论区数据层 (API 版) ===== */
/* 依赖: common.js (必须先加载) */

/* ===== 帖子 API ===== */

async function getAllPosts() {
  try {
    var result = await apiGet('/api/forum/posts?pageSize=1000');
    return result.items || [];
  } catch(e) { console.error('getAllPosts error:', e); return []; }
}

async function getPostById(id) {
  try { return await apiGet('/api/forum/posts/' + id); }
  catch(e) { console.error('getPostById error:', e); return null; }
}

async function createPost(data) {
  return await apiPost('/api/forum/posts', data);
}

async function updatePost(id, data) {
  return await apiPut('/api/forum/posts/' + id, data);
}

async function deletePost(id) {
  return await apiDelete('/api/forum/posts/' + id);
}

async function getPostsByCategory(categoryId, opts) {
  opts = opts || {};
  var sort = opts.sort || 'latest';
  var page = opts.page || 1;
  var pageSize = opts.pageSize || 20;
  try {
    return await apiGet('/api/forum/posts?category=' + categoryId + '&sort=' + sort + '&page=' + page + '&pageSize=' + pageSize);
  } catch(e) { console.error('getPostsByCategory error:', e); return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }; }
}

async function getPostsByAuthor(authorEmail, page, pageSize) {
  page = page || 1; pageSize = pageSize || 50;
  try {
    return await apiGet('/api/forum/posts?author=' + encodeURIComponent(authorEmail) + '&page=' + page + '&pageSize=' + pageSize);
  } catch(e) { console.error('getPostsByAuthor error:', e); return { items: [], total: 0 }; }
}

/* ===== 回复 API ===== */

async function getRepliesByPost(postId) {
  try { return await apiGet('/api/forum/posts/' + postId + '/replies'); }
  catch(e) { console.error('getRepliesByPost error:', e); return []; }
}

async function createReply(data) {
  return await apiPost('/api/forum/posts/' + data.postId + '/replies', data);
}

async function deleteReply(id) {
  return await apiDelete('/api/forum/replies/' + id);
}

/* ===== 点赞 API ===== */

function isLiked(type, id) {
  try {
    var data = localStorage.getItem('glory_forum_likes');
    var likes = data ? JSON.parse(data) : {};
    return !!likes[type + ':' + id];
  } catch(e) { return false; }
}

async function toggleLike(type, id) {
  try {
    var endpoint = type === 'post' ? '/api/forum/posts/' + id + '/like' : '/api/forum/replies/' + id + '/like';
    var result = await apiPost(endpoint, {});
    var data = localStorage.getItem('glory_forum_likes');
    var likes = data ? JSON.parse(data) : {};
    var key = type + ':' + id;
    if (result.liked) likes[key] = true;
    else delete likes[key];
    localStorage.setItem('glory_forum_likes', JSON.stringify(likes));
    return result;
  } catch(e) { console.error('toggleLike error:', e); throw e; }
}
