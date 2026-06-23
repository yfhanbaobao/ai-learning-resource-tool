# 公众号 Cloudflare 接入结果

## Cloudflare URL

公众号后台 **配置消息推送** 的 URL 填：

```text
https://ai-learning-resource-tool.13467896029.workers.dev/wechat
```

在 Cloudflare 后台查看位置：

```text
Cloudflare Dashboard
-> Workers & Pages
-> ai-learning-resource-tool
-> Domains & Routes / workers.dev
```

## Token

Token 的真实值在本地：

```text
D:\AI SPACE\ai-learning-resource-tool\.env.local
```

字段名：

```text
WECHAT_TOKEN
```

Cloudflare 后台只能看到 Secret 名称，看不到明文：

```text
Cloudflare Dashboard
-> Workers & Pages
-> ai-learning-resource-tool
-> Settings
-> Variables and Secrets
-> WECHAT_TOKEN
```

公众号后台 Token 输入框要填 `.env.local` 里 `WECHAT_TOKEN` 的同一个值。

## 已同步到 Cloudflare 的 Secrets

- `WECHAT_TOKEN`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_ENCODING_AES_KEY`

## 已验证

- URL GET 校验通过：`200 codex-ok`
- 文本消息自动回复通过：用户发 `资料包` 时返回 XML 文本回复
- access_token 获取通过
- 收款码上传永久素材成功
- 公众号草稿创建成功

## 素材与草稿

收款码永久素材：

```text
media_id: vxn-CcqpxWgPxQMUL_s1jclEi8r6HrSNocVTOBbOR0TgSSr1ZtiqR9YF_ZWLyayj
url: http://mmbiz.qpic.cn/mmbiz_jpg/b52oe0mct8iaDljyU3DcrfTQJpicxSD3XnHNbYI6pLpBq4kUYwDhmtibqRPUic0lGOdLrO40Oxe3fwXVJS5dPjYvNL0sBpLIaDeSrRwqT1OIO7Q/0?wx_fmt=jpeg
```

草稿：

```text
media_id: vxn-CcqpxWgPxQMUL_s1jROVjcO256V4hVQfaUtkS7zKmqRlPpKhtA-RFYW5VoqM
```

## 本地命令

检查 API：

```powershell
npm.cmd run agent:wechat-publish
```

上传收款码素材：

```powershell
npm.cmd run wechat:upload-payment-qr
```

创建草稿：

```powershell
npm.cmd run wechat:create-draft
```
