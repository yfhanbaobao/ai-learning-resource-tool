async function sha1Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyWeChatSignature(url, token) {
  const signature = url.searchParams.get('signature');
  const timestamp = url.searchParams.get('timestamp');
  const nonce = url.searchParams.get('nonce');
  if (!signature || !timestamp || !nonce) return false;

  const digest = await sha1Hex([token, timestamp, nonce].sort().join(''));
  return digest === signature;
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
