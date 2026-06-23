# 微信消息推送配置

## 你现在要填的地方

在公众号后台的 **设置与开发 -> 基本配置 -> 域名与消息推送配置 -> 启用** 里填写：

- URL：`https://<你的Worker域名>/wechat`
- Token：和本地 `WECHAT_TOKEN` 保持一致
- EncodingAESKey：先不用，当前入口用明文模式跑通
- 消息加密：选 `明文模式`
- 数据格式：`XML`

## 这个 URL 从哪里来

这个项目已经准备了 Cloudflare Worker 入口：

- Worker 路由文件：`src/worker.js`
- Cloudflare 配置：`wrangler.jsonc`

部署后，URL 取决于你的站点域名：

- 测试域名：`https://<worker-name>.<account>.workers.dev/wechat`
- 自定义域名：`https://<你的域名>/wechat`

## Token 怎么填

Token 需要你自己定一个 3-32 位英文或数字字符串，然后：

1. 在微信后台 Token 栏填同一个值
2. 在 Cloudflare Worker 里保存为 `WECHAT_TOKEN`

本地入口已经按这个 Token 做签名校验。

## 目前的边界

- 这版先负责微信后台 URL 校验
- 公众号消息接收先返回 `success`
- 真正的自动回复、素材、草稿接口后面再接
