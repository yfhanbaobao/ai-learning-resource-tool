const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');
const defaultQrPath = path.join(root, 'site', 'assets', 'payments', 'wechat-pay-2.99.jpg');
const defaultDraftPath = path.join(root, 'docs', 'content', 'wechat', '2026-06-23-ai-side-hustle-starter-wechat-draft.md');
const reportPath = path.join(root, 'docs', 'operations', 'wechat-publish-report.json');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      if (!line || line.trim().startsWith('#')) return acc;
      const index = line.indexOf('=');
      if (index === -1) return acc;
      acc[line.slice(0, index).trim()] = line.slice(index + 1).trim();
      return acc;
    }, {});
}

function requireEnv(env, key) {
  if (!env[key]) throw new Error(`${key} is missing in .env.local`);
  return env[key];
}

function writeReport(data) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(data, null, 2) + '\n');
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { errcode: -1, errmsg: text };
  }
}

async function getAccessToken(env) {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', requireEnv(env, 'WECHAT_APP_ID'));
  url.searchParams.set('secret', requireEnv(env, 'WECHAT_APP_SECRET'));

  const response = await fetch(url);
  const payload = await readJsonResponse(response);
  if (!payload.access_token) {
    const error = new Error(payload.errmsg || 'failed to get access_token');
    error.payload = payload;
    throw error;
  }
  return payload.access_token;
}

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

async function uploadPermanentMaterial(accessToken, filePath, type = 'image') {
  if (!fs.existsSync(filePath)) throw new Error(`material file not found: ${filePath}`);
  const url = new URL('https://api.weixin.qq.com/cgi-bin/material/add_material');
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('type', type);

  const blob = new Blob([fs.readFileSync(filePath)], { type: mimeTypeFor(filePath) });
  const form = new FormData();
  form.append('media', blob, path.basename(filePath));

  const response = await fetch(url, { method: 'POST', body: form });
  const payload = await readJsonResponse(response);
  if (!payload.media_id) {
    const error = new Error(payload.errmsg || 'failed to upload material');
    error.payload = payload;
    throw error;
  }
  return payload;
}

function markdownToWechatHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inCode = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCode = !inCode;
      html.push(inCode ? '<pre><code>' : '</code></pre>');
      continue;
    }
    if (inCode) {
      html.push(line.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char])));
      continue;
    }
    if (line.startsWith('# ')) {
      html.push(`<h1>${line.slice(2)}</h1>`);
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${line.slice(3)}</h2>`);
    } else if (/^\d+\.\s+/.test(line)) {
      html.push(`<p>${line}</p>`);
    } else if (line.startsWith('- ')) {
      html.push(`<p>${line}</p>`);
    } else if (line.trim()) {
      html.push(`<p>${line}</p>`);
    }
  }

  return html.join('\n');
}

async function createDraft(accessToken, env, draftPath = defaultDraftPath) {
  const thumbMediaId = env.WECHAT_DRAFT_THUMB_MEDIA_ID || env.WECHAT_THUMB_MEDIA_ID;
  if (!thumbMediaId) {
    throw new Error('WECHAT_DRAFT_THUMB_MEDIA_ID is required to create a WeChat draft');
  }

  const markdown = fs.readFileSync(draftPath, 'utf8');
  const title = (markdown.match(/^#\s+(.+)$/m) || [null, 'Windows 新手如何做出第一个 AI 副业启动页'])[1];
  const digest = '先跑通本地 AI 环境，再做一个能发布的 AI 副业启动页。';
  const url = new URL('https://api.weixin.qq.com/cgi-bin/draft/add');
  url.searchParams.set('access_token', accessToken);

  const body = {
    articles: [
      {
        title,
        author: env.WECHAT_AUTHOR || '憨憨的学习空间',
        digest,
        content: markdownToWechatHtml(markdown),
        content_source_url: env.WECHAT_CONTENT_SOURCE_URL || env.WECHAT_MESSAGE_URL || '',
        thumb_media_id: thumbMediaId,
        need_open_comment: 0,
        only_fans_can_comment: 0
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await readJsonResponse(response);
  if (!payload.media_id) {
    const error = new Error(payload.errmsg || 'failed to create draft');
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function main() {
  const env = loadEnv(envPath);
  const command = process.argv[2] || 'check';
  const report = {
    generated_at: new Date().toISOString(),
    command,
    ok: false
  };

  try {
    const accessToken = await getAccessToken(env);
    report.access_token = 'ok';

    if (command === 'check') {
      report.ok = true;
    } else if (command === 'upload-payment-qr') {
      const result = await uploadPermanentMaterial(accessToken, process.argv[3] || defaultQrPath, 'image');
      report.ok = true;
      report.material = {
        type: 'image',
        media_id: result.media_id,
        url: result.url
      };
    } else if (command === 'create-draft') {
      const result = await createDraft(accessToken, env, process.argv[3] || defaultDraftPath);
      report.ok = true;
      report.draft = {
        media_id: result.media_id
      };
    } else {
      throw new Error(`unknown command: ${command}`);
    }
  } catch (error) {
    report.error = error.message;
    if (error.payload) {
      report.wechat_error = {
        errcode: error.payload.errcode,
        errmsg: error.payload.errmsg
      };
    }
    process.exitCode = 1;
  } finally {
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
  }
}

main();
