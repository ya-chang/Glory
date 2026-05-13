exports.handler = async (event, context) => {
  const diagnostics = {
    status: 'handler_ok',
    nodeVersion: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV || '(unset)',
      OSS_REGION: process.env.OSS_REGION || '(unset)',
      OSS_BUCKET: process.env.OSS_BUCKET_NAME || '(unset)',
      OSS_KEY_SET: !!process.env.OSS_ACCESS_KEY_ID,
      JWT_SET: !!process.env.JWT_SECRET,
      RESEND_SET: !!process.env.RESEND_API_KEY,
    },
    timestamp: new Date().toISOString()
  };

  // 尝试加载 app 模块
  try {
    const app = require('./app');
    diagnostics.appLoaded = true;
    diagnostics.appType = typeof app;
  } catch (e) {
    diagnostics.appLoaded = false;
    diagnostics.loadError = e.message;
    diagnostics.loadStack = e.stack;
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: Buffer.from(JSON.stringify(diagnostics, null, 2)).toString('base64'),
    isBase64Encoded: true
  };
};
