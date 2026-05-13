/**
 * index.js - 阿里云函数计算 FC 3.0 入口
 * 
 * FC 3.0 HTTP 触发器把 event 作为 Buffer 传入
 * 需要先转为字符串再解析 JSON
 */

const http = require('http');

let server = null;
let serverReady = null;

function getServer() {
  if (!serverReady) {
    server = http.createServer(app);
    serverReady = new Promise((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        console.log('[FC] Server listening on port', server.address().port);
        resolve(server);
      });
      server.on('error', (err) => {
        console.error('[FC] Server error:', err);
        serverReady = null;
        server = null;
        reject(err);
      });
    });
  }
  return serverReady;
}

// 全局错误兜底，防止进程崩溃
process.on('uncaughtException', (err) => {
  console.error('[FC] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FC] Unhandled rejection:', reason);
});

// 预加载 app 模块（尽早发现加载错误）
let app;
let loadError = null;
try {
  app = require('./app');
  console.log('[FC] App module loaded OK');
} catch (err) {
  loadError = err;
  console.error('[FC] App module load FAILED:', err);
}

exports.handler = async (event, context) => {
  try {
    // 如果 app 加载失败，返回诊断信息
    if (loadError) {
      return {
        statusCode: 500,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
        body: Buffer.from(JSON.stringify({
          error: 'App module failed to load',
          message: loadError.message,
          stack: loadError.stack,
          env: {
            NODE_ENV: process.env.NODE_ENV,
            OSS_REGION: process.env.OSS_REGION,
            OSS_BUCKET: process.env.OSS_BUCKET_NAME,
            OSS_KEY_SET: !!process.env.OSS_ACCESS_KEY_ID,
            JWT_SET: !!process.env.JWT_SECRET,
            RESEND_SET: !!process.env.RESEND_API_KEY,
          }
        })).toString('base64'),
        isBase64Encoded: true
      };
    }

    // FC 3.0 传入的是 Buffer，需要转字符串再解析
    let evt;
    if (Buffer.isBuffer(event)) {
      try { evt = JSON.parse(event.toString()); } catch (e) { evt = {}; }
    } else if (typeof event === 'string') {
      try { evt = JSON.parse(event); } catch (e) { evt = {}; }
    } else {
      evt = event || {};
    }

    const method = (evt.httpMethod || (evt.requestContext && evt.requestContext.http && evt.requestContext.http.method) || 'GET').toUpperCase();
    const reqPath = evt.rawPath || evt.path || '/';
    const query = evt.queryStringParameters || {};
    const headers = evt.headers || {};
    const body = evt.body || '';
    const isBase64 = evt.isBase64Encoded || false;

    // OPTIONS 预检
    if (method === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'access-control-allow-origin': headers['origin'] || '*',
          'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'access-control-allow-headers': 'Content-Type, Authorization',
          'access-control-max-age': '86400'
        },
        body: '',
        isBase64Encoded: false
      };
    }

    const qsStr = Object.entries(query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const fullUrl = reqPath + (qsStr ? '?' + qsStr : '');

    let bodyBuf = null;
    if (body) {
      bodyBuf = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
    }

    // 等待 server 就绪（修复竞态条件）
    const srv = await getServer();
    const addr = srv.address();

    return new Promise((resolve) => {
      const reqHeaders = { ...headers, host: 'localhost' };
      if (bodyBuf) {
        reqHeaders['content-length'] = bodyBuf.length;
      }

      const proxyHeaders = {
        'access-control-allow-origin': headers['origin'] || '*',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-allow-headers': 'Content-Type, Authorization',
      };

      const opts = {
        hostname: '127.0.0.1',
        port: addr.port,
        method: method,
        path: fullUrl,
        headers: reqHeaders
      };

      const req = http.request(opts, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const respBody = Buffer.concat(chunks);
          const respHeaders = { ...res.headers, ...proxyHeaders };
          delete respHeaders['content-disposition'];

          resolve({
            statusCode: res.statusCode,
            headers: respHeaders,
            body: respBody.toString('base64'),
            isBase64Encoded: true
          });
        });
      });

      req.on('error', (err) => {
        console.error('[FC] Proxy error:', err.message);
        resolve({
          statusCode: 502,
          headers: { 'content-type': 'application/json', ...proxyHeaders },
          body: Buffer.from(JSON.stringify({ error: 'Bad Gateway: ' + err.message })).toString('base64'),
          isBase64Encoded: true
        });
      });

      req.setTimeout(25000, () => {
        req.destroy();
        resolve({
          statusCode: 504,
          headers: { 'content-type': 'application/json', ...proxyHeaders },
          body: Buffer.from(JSON.stringify({ error: 'Gateway Timeout' })).toString('base64'),
          isBase64Encoded: true
        });
      });

      if (bodyBuf) {
        req.write(bodyBuf);
      }
      req.end();
    });
  } catch (err) {
    console.error('[FC] Handler error:', err);
    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: Buffer.from(JSON.stringify({ error: 'Internal Server Error: ' + err.message })).toString('base64'),
      isBase64Encoded: true
    };
  }
};
