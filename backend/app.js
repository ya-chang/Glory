/**
 * app.js - 荣耀社区后端 API
 * 
 * 路由：
 *   POST /api/register          - 注册
 *   GET  /api/verify?token=xxx  - 验证邮箱
 *   POST /api/login             - 登录
 *   POST /api/reset-password    - 发送密码重置邮件
 *   POST /api/reset-password/confirm - 确认重置密码
 *   GET  /api/me                - 获取当前用户信息（需 token）
 * 
 *   Forum:
 *     GET  /api/forum/categories
 *     GET  /api/forum/posts
 *     GET  /api/forum/posts/:id
 *     POST /api/forum/posts
 *     PUT  /api/forum/posts/:id
 *     DELETE /api/forum/posts/:id
 *     POST /api/forum/posts/:id/like
 *     GET  /api/forum/posts/:id/replies
 *     POST /api/forum/posts/:id/replies
 *     DELETE /api/forum/replies/:id
 *     POST /api/forum/replies/:id/like
 * 
 *   OC:
 *     GET  /api/ocs
 *     GET  /api/ocs/:id
 *     POST /api/ocs
 *     PUT  /api/ocs/:id
 *     DELETE /api/ocs/:id
 * 
 *   Profile:
 *     GET  /api/profile
 *     GET  /api/profile/:email
 *     PUT  /api/profile
 *     PUT  /api/password
 * 
 *   Notifications:
 *     GET  /api/notifications
 *     PUT  /api/notifications/:id/read
 *     PUT  /api/notifications/read-all
 * 
 *   Search:
 *     GET  /api/search
 * 
 *   Community:
 *     GET  /api/community/hot-posts
 *     GET  /api/community/stats
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const db = require('./db');
const email = require('./email');

const app = express();

// CORS - 允许 GitHub Pages 和本地开发
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://ya-chang.github.io'
    : ['https://ya-chang.github.io', 'http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// ============ Rate Limiting ============
const rateLimitStore = {};

function rateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 1, resetAt: now + windowMs };
    return true;
  }
  const entry = rateLimitStore[key];
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// 定期清理过期的 rate limit 记录
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(rateLimitStore)) {
    if (now > rateLimitStore[key].resetAt) {
      delete rateLimitStore[key];
    }
  }
}, 60000);

// ============ 输入过滤 ============
function sanitizeText(str, maxLen = 10000) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function sanitizeUsername(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '').trim().slice(0, 20);
}

// JWT 密钥（部署时通过环境变量设置）
const JWT_SECRET = process.env.JWT_SECRET || 'glory-secret-change-me-in-production';
const SITE_URL = process.env.SITE_URL || 'https://ya-chang.github.io/glory';

// ============ 管理员初始化 ============
const ADMIN_EMAIL = '3117797385@qq.com';
const ADMIN_PASSWORD = 'wsrs0927';

async function ensureAdmin() {
  try {
    const existing = await db.getUserByEmail(ADMIN_EMAIL);
    if (!existing) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await db.createUser(ADMIN_EMAIL, '管理员', hash);
      await db.updateUser(ADMIN_EMAIL, { emailVerified: true, role: 'admin' });
      await db.updateUserProfile(ADMIN_EMAIL, {
        username: '管理员',
        joinDate: new Date().toISOString().slice(0, 10),
        exp: 99999
      });
      console.log('[Admin] Created admin account:', ADMIN_EMAIL);
    } else if (existing.role !== 'admin') {
      await db.updateUser(ADMIN_EMAIL, { role: 'admin' });
      console.log('[Admin] Upgraded to admin:', ADMIN_EMAIL);
    }
  } catch (err) {
    console.error('[Admin] Init error:', err.message);
  }
}
const adminReady = ensureAdmin();

// ============ Auth 中间件 ============

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// 可选认证（有 token 就解析，没有也放行）
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {}
  }
  next();
}

// 管理员权限中间件
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    // 优先用 JWT 中的 role 判断（避免 ensureAdmin 未完成的竞态条件）
    if (decoded.role === 'admin') {
      return next();
    }
    const user = await db.getUserByEmail(decoded.email);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

// ============ 注册 ============

app.post('/api/register', async (req, res) => {
  try {
    // Rate limit: 5次/分钟
    const ip = req.ip || req.connection.remoteAddress;
    if (!rateLimit(`register:${ip}`, 5, 60000)) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }

    const { email: rawEmail, username, password } = req.body;
    const userEmail = (rawEmail || '').trim().toLowerCase();

    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername || cleanUsername.length < 2) {
      return res.status(400).json({ error: '用户名需要2-20个字符（仅支持中文、英文、数字、下划线）' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    const existing = await db.getUserByEmail(userEmail);
    if (existing) {
      if (existing.emailVerified) {
        return res.status(409).json({ error: '该邮箱已被注册', code: 'EMAIL_EXISTS' });
      }
      await db.updateUser(userEmail, { emailVerified: true, role: existing.role || 'user' });
      const token = jwt.sign(
        { email: existing.email, username: existing.username, role: existing.role || 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        message: '注册成功',
        token,
        user: { email: existing.email, username: existing.username, role: existing.role || 'user' }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.createUser(userEmail, cleanUsername, passwordHash);
    await db.updateUser(userEmail, { emailVerified: true, role: 'user' });

    // 创建默认用户资料
    await db.updateUserProfile(userEmail, {
      username: cleanUsername,
      joinDate: new Date().toISOString().slice(0, 10),
      exp: 0
    });

    const token = jwt.sign(
      { email: newUser.email, username: newUser.username, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '注册成功',
      token,
      user: { email: newUser.email, username: newUser.username, role: 'user' }
    });

  } catch (err) {
    console.error('[Register] Error:', err);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// ============ 验证邮箱 ============

app.get('/api/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: '缺少验证参数' });
    }

    const tokenData = await db.getToken('verify', token);
    if (!tokenData) {
      return res.status(400).json({ error: '验证链接已过期或无效' });
    }

    await db.updateUser(tokenData.email, { emailVerified: true });
    await db.removeToken('verify', token);

    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>验证成功 - 荣耀社区</title>
<style>
  body { margin:0; background:#0a0608; font-family:'Microsoft YaHei',sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .card { text-align:center; padding:40px; background:rgba(18,8,8,0.9); border:1px solid rgba(140,80,30,0.2); border-radius:8px; max-width:400px; }
  h1 { color:#34a853; font-size:24px; letter-spacing:4px; margin-bottom:16px; }
  p { color:rgba(200,160,80,0.6); font-size:14px; line-height:1.8; }
  a { display:inline-block; margin-top:24px; padding:12px 32px; background:linear-gradient(180deg,#d44020,#a02818); color:#1a0800; text-decoration:none; border-radius:4px; font-weight:700; letter-spacing:6px; }
</style>
</head>
<body>
  <div class="card">
    <h1>✓ 验证成功</h1>
    <p>你的邮箱已验证通过<br>现在可以登录荣耀社区了</p>
    <a href="${SITE_URL}/index.html">前往登录</a>
  </div>
</body>
</html>`);

  } catch (err) {
    console.error('[Verify] Error:', err);
    res.status(500).send('验证失败，请稍后重试');
  }
});

// ============ 登录 ============

app.post('/api/login', async (req, res) => {
  try {
    // Rate limit: 10次/分钟
    const ip = req.ip || req.connection.remoteAddress;
    if (!rateLimit(`login:${ip}`, 10, 60000)) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }

    const { email: rawEmail, password } = req.body;
    const userEmail = (rawEmail || '').trim().toLowerCase();

    if (!userEmail || !password) {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    const user = await db.getUserByEmail(userEmail);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = jwt.sign(
      { email: user.email, username: user.username, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: { email: user.email, username: user.username, role: user.role || 'user' }
    });

  } catch (err) {
    console.error('[Login] Error:', err);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// ============ 发送密码重置邮件 ============

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const userEmail = (rawEmail || '').trim().toLowerCase();

    if (!userEmail) {
      return res.status(400).json({ error: '请输入邮箱' });
    }

    const user = await db.getUserByEmail(userEmail);
    if (!user) {
      return res.json({ message: '如果该邮箱已注册，你将收到密码重置邮件' });
    }

    const token = uuidv4();
    await db.saveToken('reset', token, userEmail, 60 * 60 * 1000);
    const resetUrl = `${SITE_URL}/reset.html?token=${token}`;
    const result = await email.sendResetEmail(userEmail, user.username, resetUrl);

    if (!result.success) {
      return res.status(500).json({ error: '邮件发送失败，请稍后重试' });
    }

    res.json({ message: '如果该邮箱已注册，你将收到密码重置邮件' });

  } catch (err) {
    console.error('[ResetPassword] Error:', err);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// ============ 确认重置密码 ============

app.post('/api/reset-password/confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: '缺少参数' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    const tokenData = await db.getToken('reset', token);
    if (!tokenData) {
      return res.status(400).json({ error: '重置链接已过期或无效' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.updateUser(tokenData.email, { password: passwordHash });
    await db.removeToken('reset', token);

    res.json({ message: '密码已重置，请使用新密码登录' });

  } catch (err) {
    console.error('[ResetConfirm] Error:', err);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// ============ 重新发送验证邮件 ============

app.post('/api/resend-verification', async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const userEmail = (rawEmail || '').trim().toLowerCase();

    if (!userEmail || !password) {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    const user = await db.getUserByEmail(userEmail);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    if (user.emailVerified) {
      return res.json({ message: '邮箱已验证，请直接登录' });
    }

    const token = uuidv4();
    await db.saveToken('verify', token, userEmail, 24 * 60 * 60 * 1000);
    const verifyUrl = `${SITE_URL}/verify.html?token=${token}`;
    const result = await email.sendVerificationEmail(userEmail, user.username, verifyUrl);

    if (!result.success) {
      return res.status(500).json({ error: '邮件发送失败，请稍后重试' });
    }

    res.json({ message: '验证邮件已重新发送' });

  } catch (err) {
    console.error('[ResendVerification] Error:', err);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// ============ 获取当前用户 ============

app.get('/api/me', requireAuth, async (req, res) => {
  const user = await db.getUserByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ email: user.email, username: user.username });
});

// ============ 健康检查 ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ============ 论坛版块 ============

const FORUM_CATEGORIES = [
  { id: 'original', name: '原作讨论', icon: '📖', desc: '小说、动画、漫画、角色分析', color: '#1a73e8' },
  { id: 'fanwork', name: '同人创作', icon: '🎨', desc: '同人文、同人图、COS、视频', color: '#34a853' },
  { id: 'casual', name: '灌水闲聊', icon: '🌊', desc: '日常、表情包、荣耀梗', color: '#e65100' },
  { id: 'meta', name: '站务中心', icon: '📢', desc: '公告、规则、建议反馈', color: '#6a1b9a' }
];

app.get('/api/forum/categories', (req, res) => {
  res.json(FORUM_CATEGORIES);
});

// ============ 论坛帖子 ============

// 获取帖子列表
app.get('/api/forum/posts', async (req, res) => {
  try {
    const { category, author, sort = 'latest', page = 1, pageSize = 20 } = req.query;
    if (category) {
      const result = await db.getPostsByCategory(category, { sort, page: parseInt(page), pageSize: parseInt(pageSize) });
      return res.json(result);
    }
    // 按作者筛选（忽略大小写）
    const authorStr = typeof author === 'string' ? author.trim() : '';
    if (authorStr) {
      const authorLower = authorStr.toLowerCase();
      const allPosts = await db.getForumPosts();
      let posts = allPosts.filter(p => p.authorId && p.authorId.toLowerCase() === authorLower);
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const total = posts.length;
      const start = (parseInt(page) - 1) * parseInt(pageSize);
      const items = posts.slice(start, start + parseInt(pageSize));
      return res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize), totalPages: Math.ceil(total / parseInt(pageSize)) });
    }
    // 无分类则返回全部
    const allPosts = await db.getForumPosts();
    let posts = [...allPosts];
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
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const items = posts.slice(start, start + parseInt(pageSize));
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize), totalPages: Math.ceil(total / parseInt(pageSize)) });
  } catch (err) {
    console.error('[Forum] Get posts error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取帖子详情
app.get('/api/forum/posts/:id', async (req, res) => {
  try {
    const post = await db.incrementPostViewCount(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    res.json(post);
  } catch (err) {
    console.error('[Forum] Get post error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建帖子
app.post('/api/forum/posts', requireAuth, async (req, res) => {
  try {
    // Rate limit: 10次/分钟
    const ip = req.ip || req.connection.remoteAddress;
    if (!rateLimit(`post:${ip}`, 10, 60000)) {
      return res.status(429).json({ error: '发帖过于频繁，请稍后再试' });
    }

    const { title, content, category, tags } = req.body;
    const cleanTitle = sanitizeText(title, 100);
    const cleanContent = sanitizeText(content, 50000);
    if (!cleanTitle || !cleanContent || !category) {
      return res.status(400).json({ error: '标题、内容和版块不能为空' });
    }
    if (cleanTitle.length > 100) {
      return res.status(400).json({ error: '标题不能超过100字' });
    }

    // 获取用户资料
    const profile = await db.getUserProfile(req.user.email);
    const user = await db.getUserByEmail(req.user.email);

    const post = await db.createForumPost({
      title: cleanTitle,
      content: cleanContent,
      category: sanitizeText(category, 50),
      tags: (tags || []).map(t => sanitizeText(t, 20)).filter(Boolean),
      authorId: req.user.email,
      authorName: (profile && profile.username) || (user && user.username) || req.user.email,
      authorLevel: 1
    });

    res.status(201).json(post);
  } catch (err) {
    console.error('[Forum] Create post error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新帖子
app.put('/api/forum/posts/:id', requireAuth, async (req, res) => {
  try {
    const post = await db.getForumPostById(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    if (!post.authorId || post.authorId.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: '只能编辑自己的帖子' });
    }
    const updates = {};
    if (req.body.title) updates.title = req.body.title;
    if (req.body.content) updates.content = req.body.content;
    if (req.body.tags) updates.tags = req.body.tags;
    const updated = await db.updateForumPost(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    console.error('[Forum] Update post error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除帖子（管理员可删任何帖子）
app.delete('/api/forum/posts/:id', requireAuth, async (req, res) => {
  try {
    const post = await db.getForumPostById(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    const userEmail = req.user.email.toLowerCase();
    const isOwner = post.authorId && post.authorId.toLowerCase() === userEmail;
    if (!isOwner) {
      // 优先用 JWT 中的 role 判断（避免 ensureAdmin 未完成的竞态条件）
      if (req.user.role === 'admin') {
        // JWT 确认是管理员，直接放行
      } else {
        const user = await db.getUserByEmail(userEmail);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ error: '只能删除自己的帖子' });
        }
      }
    }
    await db.deleteForumPost(req.params.id);
    res.json({ message: '帖子已删除' });
  } catch (err) {
    console.error('[Forum] Delete post error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 点赞/取消点赞帖子
app.post('/api/forum/posts/:id/like', requireAuth, async (req, res) => {
  try {
    // Rate limit: 30次/分钟
    const ip = req.ip || req.connection.remoteAddress;
    if (!rateLimit(`like:${ip}`, 30, 60000)) {
      return res.status(429).json({ error: '操作过于频繁，请稍后再试' });
    }
    const post = await db.getForumPostById(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    const liked = await db.toggleForumLike('post', req.params.id, req.user.email);
    const updated = await db.getForumPostById(req.params.id);
    res.json({ liked, likeCount: updated.likeCount });
  } catch (err) {
    console.error('[Forum] Like post error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取帖子回复
app.get('/api/forum/posts/:id/replies', async (req, res) => {
  try {
    const replies = await db.getRepliesByPost(req.params.id);
    res.json(replies);
  } catch (err) {
    console.error('[Forum] Get replies error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建回复
app.post('/api/forum/posts/:id/replies', requireAuth, async (req, res) => {
  try {
    // Rate limit: 20次/分钟
    const ip = req.ip || req.connection.remoteAddress;
    if (!rateLimit(`reply:${ip}`, 20, 60000)) {
      return res.status(429).json({ error: '回复过于频繁，请稍后再试' });
    }

    const { content, replyTo, mentionUser } = req.body;
    const cleanContent = sanitizeText(content, 10000);
    if (!cleanContent) return res.status(400).json({ error: '回复内容不能为空' });

    const post = await db.getForumPostById(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    if (post.isLocked) return res.status(403).json({ error: '帖子已锁定' });

    const profile = await db.getUserProfile(req.user.email);
    const user = await db.getUserByEmail(req.user.email);

    const reply = await db.createForumReply({
      postId: req.params.id,
      content: cleanContent,
      replyTo: replyTo ? sanitizeText(replyTo, 100) : null,
      mentionUser: mentionUser ? sanitizeText(mentionUser, 50) : null,
      authorId: req.user.email,
      authorName: (profile && profile.username) || (user && user.username) || req.user.email,
      authorLevel: 1
    });

    res.status(201).json(reply);
  } catch (err) {
    console.error('[Forum] Create reply error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除回复（管理员可删任何回复）
app.delete('/api/forum/replies/:id', requireAuth, async (req, res) => {
  try {
    const reply = await db.getReplyById(req.params.id);
    if (!reply) return res.status(404).json({ error: '回复不存在' });
    const userEmail = req.user.email.toLowerCase();
    const isOwner = reply.authorId && reply.authorId.toLowerCase() === userEmail;
    if (!isOwner) {
      if (req.user.role === 'admin') {
        // JWT 确认是管理员，直接放行
      } else {
        const user = await db.getUserByEmail(userEmail);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ error: '只能删除自己的回复' });
        }
      }
    }
    await db.deleteForumReply(req.params.id);
    res.json({ message: '回复已删除' });
  } catch (err) {
    console.error('[Forum] Delete reply error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 点赞/取消点赞回复
app.post('/api/forum/replies/:id/like', requireAuth, async (req, res) => {
  try {
    const reply = await db.getReplyById(req.params.id);
    if (!reply) return res.status(404).json({ error: '回复不存在' });
    const liked = await db.toggleForumLike('reply', req.params.id, req.user.email);
    const updatedReply = await db.getReplyById(req.params.id);
    res.json({ liked, likeCount: updatedReply.likeCount });
  } catch (err) {
    console.error('[Forum] Like reply error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ OC 角色 ============

// 获取 OC 列表
app.get('/api/ocs', async (req, res) => {
  try {
    const { search = '', class: ocClass = 'all', page = 1, pageSize = 20 } = req.query;
    const result = await db.filterOCs({ search, ocClass, page: parseInt(page), pageSize: parseInt(pageSize) });
    res.json(result);
  } catch (err) {
    console.error('[OC] Get OCS error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取 OC 详情
app.get('/api/ocs/:id', async (req, res) => {
  try {
    const oc = await db.getOCById(req.params.id);
    if (!oc) return res.status(404).json({ error: 'OC 不存在' });
    res.json(oc);
  } catch (err) {
    console.error('[OC] Get OC error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建 OC
app.post('/api/ocs', requireAuth, async (req, res) => {
  try {
    // Rate limit: 10次/分钟
    const ip = req.ip || req.connection.remoteAddress;
    if (!rateLimit(`oc:${ip}`, 10, 60000)) {
      return res.status(429).json({ error: '创建过于频繁，请稍后再试' });
    }

    const data = req.body;
    const cleanName = sanitizeText(data.name, 30);
    const cleanGameId = sanitizeText(data.gameId, 30);
    if (!cleanName || !cleanGameId) {
      return res.status(400).json({ error: '角色名和游戏ID不能为空' });
    }

    const profile = await db.getUserProfile(req.user.email);
    const user = await db.getUserByEmail(req.user.email);

    const oc = await db.createOC({
      ...data,
      name: cleanName,
      gameId: cleanGameId,
      avatar: data.avatar || '',
      bio: sanitizeText(data.bio || '', 2000),
      appearance: sanitizeText(data.appearance || '', 2000),
      personality: sanitizeText(data.personality || '', 2000),
      weapon: sanitizeText(data.weapon || '', 100),
      weaponDesc: sanitizeText(data.weaponDesc || '', 500),
      customSkill: sanitizeText(data.customSkill || '', 500),
      creatorId: req.user.email,
      creatorName: (profile && profile.username) || (user && user.username) || req.user.email
    });

    res.status(201).json(oc);
  } catch (err) {
    console.error('[OC] Create OC error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新 OC
app.put('/api/ocs/:id', requireAuth, async (req, res) => {
  try {
    const oc = await db.getOCById(req.params.id);
    if (!oc) return res.status(404).json({ error: 'OC 不存在' });
    if (oc.creatorId !== req.user.email) {
      return res.status(403).json({ error: '只能编辑自己的 OC' });
    }
    const updated = await db.updateOC(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('[OC] Update OC error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除 OC
app.delete('/api/ocs/:id', requireAuth, async (req, res) => {
  try {
    const oc = await db.getOCById(req.params.id);
    if (!oc) return res.status(404).json({ error: 'OC 不存在' });
    if (oc.creatorId !== req.user.email) {
      return res.status(403).json({ error: '只能删除自己的 OC' });
    }
    await db.deleteOC(req.params.id);
    res.json({ message: 'OC 已删除' });
  } catch (err) {
    console.error('[OC] Delete OC error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 用户资料 ============

// 获取当前用户资料
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    let profile = await db.getUserProfile(req.user.email);
    if (!profile) {
      const user = await db.getUserByEmail(req.user.email);
      profile = await db.updateUserProfile(req.user.email, {
        username: user ? user.username : '',
        joinDate: new Date().toISOString().slice(0, 10),
        exp: 0
      });
    }

    // 计算统计数据
    const allPosts = await db.getForumPosts();
    const allReplies = await db.getForumReplies();
    const allOCs = await db.getOCs();

    const myPosts = allPosts.filter(p => p.authorId === req.user.email);
    const myReplies = allReplies.filter(r => r.authorId === req.user.email);
    const myOCs = allOCs.filter(o => o.creatorId === req.user.email);

    const postLikes = myPosts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
    const replyLikes = myReplies.reduce((sum, r) => sum + (r.likeCount || 0), 0);

    res.json({
      ...profile,
      stats: {
        posts: myPosts.length,
        replies: myReplies.length,
        likes: postLikes + replyLikes,
        ocs: myOCs.length
      }
    });
  } catch (err) {
    console.error('[Profile] Get profile error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取公开用户资料
app.get('/api/profile/:email', async (req, res) => {
  try {
    const profile = await db.getUserProfile(req.params.email);
    if (!profile) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const allPosts = await db.getForumPosts();
    const allOCs = await db.getOCs();
    const myPosts = allPosts.filter(p => p.authorId === req.params.email);
    const myOCs = allOCs.filter(o => o.creatorId === req.params.email);

    res.json({
      username: profile.username,
      avatar: profile.avatar,
      bio: profile.bio,
      favPlayer: profile.favPlayer,
      favTeam: profile.favTeam,
      joinDate: profile.joinDate,
      exp: profile.exp,
      stats: {
        posts: myPosts.length,
        ocs: myOCs.length
      }
    });
  } catch (err) {
    console.error('[Profile] Get public profile error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新资料
app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const { username, avatar, bio, favPlayer, favTeam } = req.body;
    const updates = {};

    if (username !== undefined) updates.username = sanitizeUsername(username);
    if (avatar !== undefined) {
      // 只允许 base64 图片或合法 URL，或空字符串（清除头像）
      if (avatar && typeof avatar === 'string') {
        const isDataImage = avatar.startsWith('data:image/');
        const isHttpsUrl = avatar.startsWith('https://');
        const isEmpty = avatar === '';
        if (!isDataImage && !isHttpsUrl && !isEmpty) {
          console.error('[Profile] Invalid avatar format:', avatar.substring(0, 50));
          return res.status(400).json({ error: '头像格式不正确，仅支持图片文件' });
        }
        // base64 图片限制 5MB（base64 编码后约 6.8MB）
        if (isDataImage && avatar.length > 7 * 1024 * 1024) {
          return res.status(400).json({ error: '头像图片过大，请压缩后重试（最大 5MB）' });
        }
      }
      updates.avatar = avatar || '';
    }
    if (bio !== undefined) updates.bio = sanitizeText(bio, 200);
    if (favPlayer !== undefined) updates.favPlayer = sanitizeText(favPlayer, 50);
    if (favTeam !== undefined) updates.favTeam = sanitizeText(favTeam, 50);

    const profile = await db.updateUserProfile(req.user.email, updates);

    // 同步更新用户名到 users 表
    if (username) {
      await db.updateUser(req.user.email, { username });
    }

    res.json(profile);
  } catch (err) {
    console.error('[Profile] Update profile error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改密码
app.put('/api/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '请输入当前密码和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少6位' });
    }

    const user = await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: '当前密码错误' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.updateUser(req.user.email, { password: passwordHash });

    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error('[Profile] Change password error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 通知 ============

// 获取通知列表
app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const notifications = await db.getNotificationsByEmail(req.user.email);
    // 按时间倒序
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json(notifications);
  } catch (err) {
    console.error('[Notification] Get notifications error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 标记单条通知已读
app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const result = await db.markNotificationRead(req.params.id, req.user.email);
    if (!result) return res.status(404).json({ error: '通知不存在' });
    res.json({ message: '已标记为已读' });
  } catch (err) {
    console.error('[Notification] Mark read error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 标记所有通知已读
app.put('/api/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const count = await db.markAllNotificationsRead(req.user.email);
    res.json({ message: `已标记 ${count} 条通知为已读` });
  } catch (err) {
    console.error('[Notification] Mark all read error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 搜索 ============

app.get('/api/search', async (req, res) => {
  try {
    // Rate limit: 20次/分钟
    const ip = req.ip || req.connection.remoteAddress;
    if (!rateLimit(`search:${ip}`, 20, 60000)) {
      return res.status(429).json({ error: '搜索过于频繁，请稍后再试' });
    }

    const { q } = req.query;
    if (!q) return res.json({ posts: [], ocs: [], players: [] });
    const cleanQuery = sanitizeText(q, 100);

    const results = await db.searchAll(cleanQuery);

    // 选手数据是静态的，前端自行搜索
    res.json({
      posts: results.posts,
      ocs: results.ocs,
      players: [] // 前端从 players.js 搜索
    });
  } catch (err) {
    console.error('[Search] Error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 管理员 API ============

// 置顶/取消置顶帖子
app.put('/api/admin/posts/:id/pin', requireAdmin, async (req, res) => {
  try {
    const post = await db.getForumPostById(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    const updated = await db.updateForumPost(req.params.id, { isPinned: !post.isPinned });
    res.json({ message: updated.isPinned ? '已置顶' : '已取消置顶', isPinned: updated.isPinned });
  } catch (err) {
    console.error('[Admin] Pin post error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 锁定/解锁帖子
app.put('/api/admin/posts/:id/lock', requireAdmin, async (req, res) => {
  try {
    const post = await db.getForumPostById(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    const updated = await db.updateForumPost(req.params.id, { isLocked: !post.isLocked });
    res.json({ message: updated.isLocked ? '已锁定' : '已解锁', isLocked: updated.isLocked });
  } catch (err) {
    console.error('[Admin] Lock post error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 发布公告（创建置顶帖到站务中心）
app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    const cleanTitle = sanitizeText(title, 100);
    const cleanContent = sanitizeText(content, 50000);
    if (!cleanTitle || !cleanContent) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }
    const profile = await db.getUserProfile(req.user.email);
    const user = await db.getUserByEmail(req.user.email);
    const post = await db.createForumPost({
      title: '📢 [公告] ' + cleanTitle,
      content: cleanContent,
      category: 'meta',
      tags: ['公告'],
      authorId: req.user.email,
      authorName: (profile && profile.username) || (user && user.username) || '管理员',
      authorLevel: 99
    });
    // 自动置顶
    await db.updateForumPost(post.id, { isPinned: true });
    res.status(201).json(post);
  } catch (err) {
    console.error('[Admin] Announcement error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有用户列表（管理员）
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const d = await db.loadDb();
    const users = Object.values(d.users).map(u => ({
      email: u.email,
      username: u.username,
      role: u.role || 'user',
      createdAt: u.createdAt
    }));
    res.json(users);
  } catch (err) {
    console.error('[Admin] Get users error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 社区 ============

app.get('/api/community/hot-posts', async (req, res) => {
  try {
    const hotPosts = await db.getHotPosts(5);
    res.json(hotPosts);
  } catch (err) {
    console.error('[Community] Hot posts error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/community/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    console.error('[Community] Stats error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = app;
