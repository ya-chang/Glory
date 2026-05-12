/**
 * db.js - 数据库层（阿里云 OSS 存储）
 * 
 * 使用 OSS 存储 JSON 文件作为数据库
 * 小型社区完全够用，零额外费用
 */

const OSS = require('ali-oss');

const DB_FILE = 'glory-db.json';

let client = null;
let db = null;

// 初始化 OSS 客户端
function getClient() {
  if (!client) {
    client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET_NAME,
    });
  }
  return client;
}

// 空数据库模板
function emptyDb() {
  return {
    users: {},
    tokens: {},
    forumPosts: [],
    forumReplies: [],
    forumLikes: {},
    ocs: [],
    notifications: [],
    userProfiles: {}
  };
}

// 从 OSS 加载数据库
async function loadDb() {
  if (db) return db;
  try {
    const result = await getClient().get(DB_FILE);
    db = JSON.parse(result.content.toString());
    // 确保新字段存在
    if (!db.forumPosts) db.forumPosts = [];
    if (!db.forumReplies) db.forumReplies = [];
    if (!db.forumLikes) db.forumLikes = {};
    if (!db.ocs) db.ocs = [];
    if (!db.notifications) db.notifications = [];
    if (!db.userProfiles) db.userProfiles = {};
    console.log('[DB] Loaded from OSS, users:', Object.keys(db.users).length);
  } catch (err) {
    if (err.code === 'NoSuchKey' || err.status === 404) {
      db = emptyDb();
      console.log('[DB] No existing DB, created new');
    } else {
      console.error('[DB] Load error:', err.message);
      db = emptyDb();
    }
  }
  return db;
}

// 保存数据库到 OSS（写入队列：串行执行，不丢数据）
var writeQueue = [];
var writing = false;

async function enqueueSave() {
  if (writing) return;
  writing = true;
  try {
    await getClient().put(DB_FILE, Buffer.from(JSON.stringify(db, null, 2)), {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('[DB] Saved to OSS');
  } catch (err) {
    console.error('[DB] Save error:', err.message);
  } finally {
    writing = false;
    if (writeQueue.length > 0) {
      writeQueue.shift();
      enqueueSave();
    }
  }
}

async function saveDb() {
  writeQueue.push(true);
  enqueueSave();
}

// ============ 用户操作 ============

async function getUserByEmail(email) {
  const d = await loadDb();
  return d.users[email.toLowerCase()] || null;
}

async function createUser(email, username, passwordHash) {
  const d = await loadDb();
  const key = email.toLowerCase();
  d.users[key] = {
    email: key,
    username,
    password: passwordHash,
    emailVerified: false,
    createdAt: Date.now()
  };
  await saveDb();
  return d.users[key];
}

async function updateUser(email, updates) {
  const d = await loadDb();
  const key = email.toLowerCase();
  if (!d.users[key]) return null;
  Object.assign(d.users[key], updates);
  await saveDb();
  return d.users[key];
}

async function deleteUser(email) {
  const d = await loadDb();
  const key = email.toLowerCase();
  delete d.users[key];
  await saveDb();
}

// ============ Token 操作 ============

async function saveToken(type, token, email, expiresInMs) {
  const d = await loadDb();
  const key = `${type}:${token}`;
  d.tokens[key] = {
    email: email.toLowerCase(),
    expiresAt: Date.now() + expiresInMs
  };
  await saveDb();
}

async function getToken(type, token) {
  const d = await loadDb();
  const key = `${type}:${token}`;
  const t = d.tokens[key];
  if (!t) return null;
  if (Date.now() > t.expiresAt) {
    delete d.tokens[key];
    await saveDb();
    return null;
  }
  return t;
}

async function removeToken(type, token) {
  const d = await loadDb();
  const key = `${type}:${token}`;
  delete d.tokens[key];
  await saveDb();
}

// 清理过期 token
async function cleanExpiredTokens() {
  const d = await loadDb();
  const now = Date.now();
  let cleaned = 0;
  for (const [key, t] of Object.entries(d.tokens)) {
    if (now > t.expiresAt) {
      delete d.tokens[key];
      cleaned++;
    }
  }
  if (cleaned > 0) {
    await saveDb();
    console.log('[DB] Cleaned', cleaned, 'expired tokens');
  }
}

// ============ 论坛帖子操作 ============

async function getForumPosts() {
  const d = await loadDb();
  return d.forumPosts;
}

async function getForumPostById(id) {
  const d = await loadDb();
  return d.forumPosts.find(p => p.id === id) || null;
}

async function createForumPost(data) {
  const d = await loadDb();
  const post = {
    id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    title: data.title,
    content: data.content,
    authorId: data.authorId,
    authorName: data.authorName,
    authorLevel: data.authorLevel || 1,
    category: data.category,
    tags: data.tags || [],
    isPinned: false,
    isLocked: false,
    likeCount: 0,
    dislikeCount: 0,
    replyCount: 0,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastReplyAt: new Date().toISOString()
  };
  d.forumPosts.unshift(post);
  await saveDb();
  return post;
}

async function updateForumPost(id, updates) {
  const d = await loadDb();
  const idx = d.forumPosts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  Object.assign(d.forumPosts[idx], updates, { updatedAt: new Date().toISOString() });
  await saveDb();
  return d.forumPosts[idx];
}

async function deleteForumPost(id) {
  const d = await loadDb();
  d.forumPosts = d.forumPosts.filter(p => p.id !== id);
  d.forumReplies = d.forumReplies.filter(r => r.postId !== id);
  await saveDb();
}

async function incrementPostViewCount(id) {
  const d = await loadDb();
  const post = d.forumPosts.find(p => p.id === id);
  if (post) {
    post.viewCount = (post.viewCount || 0) + 1;
    await saveDb();
  }
  return post;
}

async function getPostsByCategory(categoryId, { sort = 'latest', page = 1, pageSize = 20 } = {}) {
  const d = await loadDb();
  let posts = d.forumPosts.filter(p => p.category === categoryId);

  if (sort === 'latest') {
    posts.sort((a, b) => new Date(b.lastReplyAt || b.createdAt) - new Date(a.lastReplyAt || a.createdAt));
  } else if (sort === 'hot') {
    posts.sort((a, b) => (b.replyCount + b.likeCount) - (a.replyCount + a.likeCount));
  } else if (sort === 'top') {
    posts.sort((a, b) => b.likeCount - a.likeCount);
  }

  const pinned = posts.filter(p => p.isPinned);
  const normal = posts.filter(p => !p.isPinned);
  posts = [...pinned, ...normal];

  const total = posts.length;
  const start = (page - 1) * pageSize;
  const items = posts.slice(start, start + pageSize);

  return { items, total, page: parseInt(page), pageSize: parseInt(pageSize), totalPages: Math.ceil(total / pageSize) };
}

// ============ 论坛回复操作 ============

async function getForumReplies() {
  const d = await loadDb();
  return d.forumReplies;
}

async function getRepliesByPost(postId) {
  const d = await loadDb();
  return d.forumReplies.filter(r => r.postId === postId);
}

async function createForumReply(data) {
  const d = await loadDb();
  const reply = {
    id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    postId: data.postId,
    content: data.content,
    authorId: data.authorId,
    authorName: data.authorName,
    authorLevel: data.authorLevel || 1,
    replyTo: data.replyTo || null,
    mentionUser: data.mentionUser || null,
    likeCount: 0,
    createdAt: new Date().toISOString()
  };
  d.forumReplies.push(reply);

  // 更新帖子回复数
  const post = d.forumPosts.find(p => p.id === data.postId);
  if (post) {
    post.replyCount = (post.replyCount || 0) + 1;
    post.lastReplyAt = new Date().toISOString();
  }

  await saveDb();
  return reply;
}

async function deleteForumReply(id) {
  const d = await loadDb();
  const reply = d.forumReplies.find(r => r.id === id);
  if (!reply) return false;
  d.forumReplies = d.forumReplies.filter(r => r.id !== id);

  // 更新帖子回复数
  const post = d.forumPosts.find(p => p.id === reply.postId);
  if (post) {
    post.replyCount = Math.max(0, (post.replyCount || 1) - 1);
  }

  await saveDb();
  return true;
}

async function getReplyById(id) {
  const d = await loadDb();
  return d.forumReplies.find(r => r.id === id) || null;
}

// ============ 论坛点赞操作 ============

async function getForumLikes() {
  const d = await loadDb();
  return d.forumLikes;
}

async function isLiked(type, id, email) {
  const d = await loadDb();
  const key = `${type}:${id}:${email}`;
  return !!d.forumLikes[key];
}

async function toggleForumLike(type, id, email) {
  const d = await loadDb();
  const key = `${type}:${id}:${email}`;

  if (d.forumLikes[key]) {
    delete d.forumLikes[key];
    // 减少计数
    if (type === 'post') {
      const post = d.forumPosts.find(p => p.id === id);
      if (post) post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
    } else {
      const reply = d.forumReplies.find(r => r.id === id);
      if (reply) reply.likeCount = Math.max(0, (reply.likeCount || 1) - 1);
    }
    await saveDb();
    return false;
  } else {
    d.forumLikes[key] = true;
    if (type === 'post') {
      const post = d.forumPosts.find(p => p.id === id);
      if (post) post.likeCount = (post.likeCount || 0) + 1;
    } else {
      const reply = d.forumReplies.find(r => r.id === id);
      if (reply) reply.likeCount = (reply.likeCount || 0) + 1;
    }
    await saveDb();
    return true;
  }
}

// ============ OC 操作 ============

async function getOCs() {
  const d = await loadDb();
  return d.ocs;
}

async function getOCById(id) {
  const d = await loadDb();
  return d.ocs.find(oc => oc.id === id) || null;
}

async function createOC(data) {
  const d = await loadDb();
  const oc = {
    id: 'oc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    name: data.name,
    gameId: data.gameId,
    avatar: data.avatar || '',
    illustration: data.illustration || '',
    age: data.age,
    gender: data.gender,
    height: data.height || '',
    birthday: data.birthday || '',
    appearance: data.appearance,
    personality: data.personality,
    class: data.class,
    weapon: data.weapon,
    weaponType: data.weaponType || '银武',
    weaponDesc: data.weaponDesc || '',
    combatStyle: data.combatStyle,
    signatureSkills: data.signatureSkills || [],
    customSkill: data.customSkill || '',
    team: data.team,
    teamRole: data.teamRole || '队员',
    bio: data.bio,
    relationships: data.relationships || [],
    commentCount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  d.ocs.push(oc);
  await saveDb();
  return oc;
}

async function updateOC(id, updates) {
  const d = await loadDb();
  const idx = d.ocs.findIndex(oc => oc.id === id);
  if (idx === -1) return null;
  Object.assign(d.ocs[idx], updates, { updatedAt: new Date().toISOString() });
  await saveDb();
  return d.ocs[idx];
}

async function deleteOC(id) {
  const d = await loadDb();
  d.ocs = d.ocs.filter(oc => oc.id !== id);
  await saveDb();
}

async function filterOCs({ search = '', ocClass = 'all', page = 1, pageSize = 20 } = {}) {
  const d = await loadDb();
  let list = d.ocs.filter(oc => oc.status === 'active');
  if (ocClass && ocClass !== 'all') {
    list = list.filter(oc => oc.class === ocClass);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(oc =>
      oc.name.toLowerCase().includes(s) ||
      oc.gameId.toLowerCase().includes(s) ||
      oc.class.toLowerCase().includes(s) ||
      oc.team.toLowerCase().includes(s) ||
      (oc.creatorName || '').toLowerCase().includes(s)
    );
  }
  const total = list.length;
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  return { items, total, page: parseInt(page), pageSize: parseInt(pageSize), totalPages: Math.ceil(total / pageSize) };
}

// ============ 通知操作 ============

async function getNotificationsByEmail(email) {
  const d = await loadDb();
  return d.notifications.filter(n => n.email === email.toLowerCase());
}

async function createNotification(data) {
  const d = await loadDb();
  const notif = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    email: data.email.toLowerCase(),
    type: data.type,
    read: false,
    from: data.from,
    postId: data.postId || '',
    postTitle: data.postTitle || '',
    content: data.content || '',
    time: new Date().toISOString()
  };
  d.notifications.push(notif);
  await saveDb();
  return notif;
}

async function markNotificationRead(id, email) {
  const d = await loadDb();
  const notif = d.notifications.find(n => n.id === id && n.email === email.toLowerCase());
  if (notif) {
    notif.read = true;
    await saveDb();
    return true;
  }
  return false;
}

async function markAllNotificationsRead(email) {
  const d = await loadDb();
  let count = 0;
  d.notifications.forEach(n => {
    if (n.email === email.toLowerCase() && !n.read) {
      n.read = true;
      count++;
    }
  });
  if (count > 0) await saveDb();
  return count;
}

// ============ 用户资料操作 ============

async function getUserProfile(email) {
  const d = await loadDb();
  return d.userProfiles[email.toLowerCase()] || null;
}

async function updateUserProfile(email, updates) {
  const d = await loadDb();
  const key = email.toLowerCase();
  if (!d.userProfiles[key]) {
    d.userProfiles[key] = {
      email: key,
      username: '',
      avatar: '',
      bio: '',
      favPlayer: '',
      favTeam: '',
      joinDate: new Date().toISOString().slice(0, 10),
      exp: 0
    };
  }
  Object.assign(d.userProfiles[key], updates);
  await saveDb();
  return d.userProfiles[key];
}

// ============ 统计操作 ============

async function getStats() {
  const d = await loadDb();
  return {
    postCount: d.forumPosts.length,
    userCount: Object.keys(d.users).length,
    ocCount: d.ocs.filter(oc => oc.status === 'active').length
  };
}

async function getHotPosts(limit = 5) {
  const d = await loadDb();
  return [...d.forumPosts]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, limit);
}

// ============ 搜索操作 ============

async function searchAll(query) {
  const d = await loadDb();
  const q = query.toLowerCase();
  const results = { posts: [], ocs: [] };

  // 搜索帖子
  d.forumPosts.forEach(p => {
    const text = [p.title, p.content, p.authorName, ...(p.tags || [])].join(' ').toLowerCase();
    if (text.includes(q)) {
      results.posts.push(p);
    }
  });

  // 搜索 OC
  d.ocs.filter(oc => oc.status === 'active').forEach(oc => {
    const text = [oc.name, oc.gameId, oc.class, oc.team, oc.bio || '', oc.creatorName || ''].join(' ').toLowerCase();
    if (text.includes(q)) {
      results.ocs.push(oc);
    }
  });

  return results;
}

module.exports = {
  // DB
  loadDb,
  // User
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  // Token
  saveToken,
  getToken,
  removeToken,
  cleanExpiredTokens,
  // Forum Posts
  getForumPosts,
  getForumPostById,
  createForumPost,
  updateForumPost,
  deleteForumPost,
  incrementPostViewCount,
  getPostsByCategory,
  // Forum Replies
  getForumReplies,
  getRepliesByPost,
  createForumReply,
  deleteForumReply,
  getReplyById,
  // Forum Likes
  getForumLikes,
  isLiked,
  toggleForumLike,
  // OC
  getOCs,
  getOCById,
  createOC,
  updateOC,
  deleteOC,
  filterOCs,
  // Notifications
  getNotificationsByEmail,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  // User Profiles
  getUserProfile,
  updateUserProfile,
  // Stats
  getStats,
  getHotPosts,
  // Search
  searchAll
};
