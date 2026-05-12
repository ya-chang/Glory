/**
 * email.js - 邮件发送（Resend）
 * 
 * 使用 Resend 发送验证邮件和密码重置邮件
 * 免费额度：3000 封/月
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || '荣耀社区';

// 启动时检查邮件配置
if (!RESEND_API_KEY) {
  console.warn('[Email] ⚠️ RESEND_API_KEY 未设置，邮件功能不可用');
} else {
  console.log('[Email] 配置: FROM_EMAIL=' + FROM_EMAIL + ', FROM_NAME=' + FROM_NAME);
}

// 发送单封邮件
async function sendEmail(toAddress, subject, htmlBody) {
  try {
    if (!RESEND_API_KEY) {
      console.error('[Email] 发送失败: RESEND_API_KEY 未配置');
      return { success: false, error: '邮件服务未配置' };
    }

    console.log('[Email] 正在发送到:', toAddress, '主题:', subject);

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [toAddress],
        subject,
        html: htmlBody,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('[Email] 发送失败:', resp.status, JSON.stringify(data));
      // Resend 免费版限制：onboarding@resend.dev 只能发给注册邮箱
      if (resp.status === 403 || (data.message && data.message.includes('testing'))) {
        console.error('[Email] 💡 提示: 使用 onboarding@resend.dev 时，只能发送到注册 Resend 的邮箱。请配置自定义域名。');
        return { success: false, error: '邮件服务受限，请联系管理员配置发件域名' };
      }
      return { success: false, error: data.message || '发送失败' };
    }

    console.log('[Email] ✅ 发送成功, Id:', data.id);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error('[Email] 异常:', err.message);
    return { success: false, error: err.message };
  }
}

// 发送验证邮件
async function sendVerificationEmail(toEmail, username, verifyUrl) {
  const subject = '【荣耀社区】请验证你的邮箱';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0608;font-family:'Microsoft YaHei','PingFang SC',sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:rgba(18,8,8,0.95);border:1px solid rgba(140,80,30,0.2);border-radius:8px;padding:40px 30px;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#c8a030;font-size:22px;letter-spacing:6px;margin:0;">🏆 荣耀社区</h1>
    </div>
    <div style="color:#f0d888;font-size:14px;line-height:1.8;">
      <p>你好，<strong>${username}</strong></p>
      <p>欢迎加入荣耀社区！请验证你的邮箱地址：</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(180deg,#d44020,#a02818,#7a1a10);color:#1a0800;text-decoration:none;border-radius:4px;font-weight:700;font-size:15px;letter-spacing:4px;text-shadow:0 1px 2px rgba(255,120,60,0.3);">验证邮箱</a>
      </div>
      <p style="color:rgba(200,160,80,0.5);font-size:12px;">如果按钮无法点击，请复制以下链接到浏览器打开：</p>
      <p style="word-break:break-all;font-size:12px;color:rgba(200,160,80,0.4);background:rgba(0,0,0,0.3);padding:10px;border-radius:4px;">${verifyUrl}</p>
      <p style="color:rgba(200,160,80,0.4);font-size:12px;margin-top:20px;">此链接24小时内有效。如果不是你注册的，请忽略此邮件。</p>
    </div>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid rgba(140,80,30,0.15);text-align:center;color:rgba(200,160,80,0.3);font-size:11px;">
      荣耀社区 · ya-chang.github.io/glory
    </div>
  </div>
</body>
</html>`;

  return sendEmail(toEmail, subject, html);
}

// 发送密码重置邮件
async function sendResetEmail(toEmail, username, resetUrl) {
  const subject = '【荣耀社区】密码重置';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0608;font-family:'Microsoft YaHei','PingFang SC',sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:rgba(18,8,8,0.95);border:1px solid rgba(140,80,30,0.2);border-radius:8px;padding:40px 30px;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#c8a030;font-size:22px;letter-spacing:6px;margin:0;">🏆 荣耀社区</h1>
    </div>
    <div style="color:#f0d888;font-size:14px;line-height:1.8;">
      <p>你好，<strong>${username}</strong></p>
      <p>我们收到了你的密码重置请求。点击以下按钮设置新密码：</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(180deg,#d44020,#a02818,#7a1a10);color:#1a0800;text-decoration:none;border-radius:4px;font-weight:700;font-size:15px;letter-spacing:4px;text-shadow:0 1px 2px rgba(255,120,60,0.3);">重置密码</a>
      </div>
      <p style="color:rgba(200,160,80,0.5);font-size:12px;">如果按钮无法点击，请复制以下链接到浏览器打开：</p>
      <p style="word-break:break-all;font-size:12px;color:rgba(200,160,80,0.4);background:rgba(0,0,0,0.3);padding:10px;border-radius:4px;">${resetUrl}</p>
      <p style="color:rgba(200,160,80,0.4);font-size:12px;margin-top:20px;">此链接1小时内有效。如果不是你请求的，请忽略此邮件。</p>
    </div>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid rgba(140,80,30,0.15);text-align:center;color:rgba(200,160,80,0.3);font-size:11px;">
      荣耀社区 · ya-chang.github.io/glory
    </div>
  </div>
</body>
</html>`;

  return sendEmail(toEmail, subject, html);
}

module.exports = { sendEmail, sendVerificationEmail, sendResetEmail };
