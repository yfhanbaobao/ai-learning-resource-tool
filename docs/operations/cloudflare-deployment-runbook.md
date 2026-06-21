# Cloudflare 部署运行手册

## 当前部署链路

本站代码托管在 GitHub 仓库：

- `yfhanbaobao/ai-learning-resource-tool`
- 分支：`main`

线上站点通过 Cloudflare Wrangler 发布到：

- `https://ai-learning-resource-tool.13467896029.workers.dev/`

当前仓库已经包含自动部署工作流：

- `.github/workflows/deploy-cloudflare-worker.yml`

每次推送到 `main` 后，GitHub Actions 会自动执行：

1. 拉取仓库代码
2. 安装 Node.js 依赖
3. 执行 `npm run ops:update` 生成最新资源数据
4. 执行 `npx wrangler deploy` 发布到 Cloudflare

## 必须配置的 GitHub Secrets

进入 GitHub 仓库后，打开：

`Settings -> Secrets and variables -> Actions -> New repository secret`

需要新增两个 Secret：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

注意：不要把 Cloudflare 登录密码、GitHub 登录密码、邮箱授权码写进仓库文件。

## Cloudflare API Token 权限建议

在 Cloudflare 控制台创建 API Token 时，建议使用最小权限：

- Account: `Workers Scripts:Edit`
- Account: `Workers Tail:Read`，可选
- Account: `Account Settings:Read`
- Zone 权限不需要，除非后续绑定自定义域名

如果 Cloudflare 使用 Pages 而不是 Workers 静态资源部署，则需要改成 Pages 部署工作流，并配置 Pages 项目名和 Account ID。

## 本地手动部署

本机已安装项目依赖后，可以在项目目录执行：

```powershell
$env:CLOUDFLARE_API_TOKEN="你的 Cloudflare API Token"
$env:CLOUDFLARE_ACCOUNT_ID="你的 Cloudflare Account ID"
npm.cmd run deploy
```

部署成功后，再访问线上地址确认页面是否更新。

## 本地预览

不需要 Cloudflare Token 时，可以使用本地静态预览：

```powershell
npm.cmd run preview:8080
```

然后打开：

`http://127.0.0.1:8080`

## 常见问题

### GitHub 已推送，但线上还是旧版

优先检查 GitHub Actions：

`https://github.com/yfhanbaobao/ai-learning-resource-tool/actions`

如果失败步骤是 `Deploy to Cloudflare`，通常表示没有配置 `CLOUDFLARE_API_TOKEN` 或 `CLOUDFLARE_ACCOUNT_ID`。

### 本地 `wrangler deploy` 报错

如果看到下面错误：

```text
In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable
```

说明当前终端没有 Cloudflare Token。按上面的“本地手动部署”方式设置环境变量后再运行。

### 不要使用网页登录密码部署

GitHub 和 Cloudflare 的网页登录密码不能作为部署凭据使用。部署应该使用 GitHub Secrets 和 Cloudflare API Token。
