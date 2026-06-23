async function sha1Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function decodeXmlCdata(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '');
}

function extractXmlTag(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`));
  if (match) return decodeXmlCdata(match[1]);
  const plain = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));
  return plain ? plain[1].trim() : '';
}

async function loadReplyRules(request, env) {
  try {
    const response = await env.ASSETS.fetch(new Request(new URL('/data/wechat-auto-replies.json', request.url)));
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload.replies) ? payload.replies : [];
  } catch {
    return [];
  }
}

function buildTextResponse({ toUserName, fromUserName, content }) {
  const safeContent = String(content || '')
    .replace(/]]>/g, ']]]]><![CDATA[>');

  return `<?xml version="1.0" encoding="UTF-8"?>
<xml>
  <ToUserName><![CDATA[${toUserName}]]></ToUserName>
  <FromUserName><![CDATA[${fromUserName}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${safeContent}]]></Content>
</xml>`;
}

async function verifyWeChatSignature(url, token) {
  const signature = url.searchParams.get('signature');
  const timestamp = url.searchParams.get('timestamp');
  const nonce = url.searchParams.get('nonce');
  if (!signature || !timestamp || !nonce) return false;

  const digest = await sha1Hex([token, timestamp, nonce].sort().join(''));
  return digest === signature;
}

function pickReply(content, replies, fallback) {
  const normalized = String(content || '').trim();
  if (!normalized) return fallback;

  const exact = replies.find((item) => normalized === String(item.keyword || '').trim());
  if (exact) return exact.reply;

  const match = replies.find((item) => normalized.includes(String(item.keyword || '').trim()));
  return match ? match.reply : fallback;
}

async function handleWeChat(request, env) {
  const token = env.WECHAT_TOKEN;
  if (!token) {
    return new Response('WECHAT_TOKEN is not configured', { status: 500 });
  }

  const url = new URL(request.url);
  const isVerified = await verifyWeChatSignature(url, token);
  if (!isVerified) {
    return new Response('invalid signature', { status: 403 });
  }

  if (request.method === 'GET') {
    return new Response(url.searchParams.get('echostr') || '', {
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }

  if (request.method === 'POST') {
    const body = await request.text();
    const msgType = extractXmlTag(body, 'MsgType');
    const fromUserName = extractXmlTag(body, 'FromUserName');
    const toUserName = extractXmlTag(body, 'ToUserName');
    const content = decodeXmlCdata(extractXmlTag(body, 'Content'));
    const event = extractXmlTag(body, 'Event');
    const rules = await loadReplyRules(request, env);
    const accountName = env.WECHAT_OFFICIAL_ACCOUNT_NAME || '憨憨的学习空间';
    const contactId = env.WECHAT_CONTACT_WECHAT_ID || 'hanbaobao_-1998';
    const fallbackReply = `已收到。先回复“资料包”领免费入口，或者继续告诉我你卡在哪一步。公众号：${accountName}，微信：${contactId}。`;

    if (msgType === 'event' && String(event || '').toLowerCase() === 'subscribe') {
      return new Response(buildTextResponse({
        toUserName: fromUserName,
        fromUserName: toUserName,
        content: `欢迎关注 ${accountName}。回复“资料包”领取免费入口，回复“环境”“启动页”“2.99”“付款”“微信”“卡点”可以拿到对应说明。`
      }), {
        headers: { 'content-type': 'application/xml; charset=utf-8' }
      });
    }

    if (msgType === 'text') {
      const reply = pickReply(content, rules, fallbackReply);
      return new Response(buildTextResponse({
        toUserName: fromUserName,
        fromUserName: toUserName,
        content: reply
      }), {
        headers: { 'content-type': 'application/xml; charset=utf-8' }
      });
    }

    return new Response('success', {
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }

  return new Response('method not allowed', { status: 405 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/wechat') {
      return handleWeChat(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
