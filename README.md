# AI 学习资源小工具

这个目录是一个“AI 学习资源运营台”的本地工作区，目标用户是 Windows 本地模型、Ollama、Vibe Coding 和 AI 自动化入门学习者。

当前已经准备好的内容：
- 本地环境检查脚本
- 本地预览脚本
- 账号注册清单文档
- 手动安装与部署准备文档
- 一个可直接本地打开和预览的静态网页骨架
- 独立资源数据文件 `data/resources.json`
- 自动运营脚本 `scripts/ops-update.js`
- 每日运营简报和市场调研报告
- Feed、Sitemap、robots.txt 自动生成

当前机器实测状态：
- 已有：`Node.js`、`npm.cmd`、`VS Code`、`Chrome`
- 缺失：`Git`、`Ollama`
- 可选优化：`Python` 已有，但版本是 `3.6.1`，能做简单预览，后续若跑新工具建议升级

## 目录说明

- `docs/01-本地环境现状.md`：这台机器当前环境状态
- `docs/02-账号注册清单.md`：最低上线版和完整变现版要注册的账号
- `docs/03-手动安装与部署准备.md`：Git、Ollama、GitHub、Cloudflare Pages 的手动准备顺序
- `scripts/check-env.ps1`：重新检测本机环境，并生成一份最新报告
- `scripts/start-preview.ps1`：本地启动静态站预览
- `site/`：网页小站骨架

## 快速开始

先补齐缺的核心工具：
- 安装 `Git`
- 安装 `Ollama`

安装后，建议按下面顺序执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-env.ps1
npm.cmd run ops:update
powershell -ExecutionPolicy Bypass -File .\scripts\start-preview.ps1
```

如果你想走 `npm` 脚本，不要直接敲 `npm`，这台机器当前 PowerShell 策略会拦截 `npm.ps1`。请改用：

```powershell
npm.cmd run check:env
npm.cmd run ops:update
npm.cmd run preview
```

## 下一步建议

1. 每次更新资源前先改 `data/resources.json`
2. 运行 `npm.cmd run ops:update` 同步站点数据并生成运营简报
3. 运行 `npm.cmd run preview` 本地预览
4. 需要自动化时运行 `scripts/register-daily-ops-task.ps1` 注册每日任务
5. 后面再接 RSS/API 数据源、GitHub、Cloudflare Pages、广告位和 SEO 页面
