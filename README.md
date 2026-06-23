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
- LIGHT 内容追踪脚本 `scripts/content-watch-agent.js`
- AI 日报生成脚本 `scripts/ai-daily-agent.js`
- 公开信源和人工关注源配置 `data/content-watch-config.json`
- 每日运营简报和市场调研报告
- Feed、Sitemap、robots.txt 自动生成

当前机器实测状态：
- 已有：`Node.js`、`npm.cmd`、`Git`、`Ollama`、`Python 3.14.6`、`VS Code`、`Chrome`
- 可选优化：Cursor CLI 暂未检测到；VS Code 可正常使用。

## 目录说明

- `docs/01-本地环境现状.md`：这台机器当前环境状态
- `docs/02-账号注册清单.md`：最低上线版和完整变现版要注册的账号
- `docs/03-手动安装与部署准备.md`：Git、Ollama、GitHub、Cloudflare Pages 的手动准备顺序
- `scripts/check-env.ps1`：重新检测本机环境，并生成一份最新报告
- `scripts/start-preview.ps1`：本地启动静态站预览
- `site/`：网页小站骨架

## 快速开始

建议按下面顺序执行：

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

## LIGHT 内容追踪和 AI 日报

只运行 LIGHT 方案里的内容追踪和 AI 日报：

```powershell
npm.cmd run ops:light
```

运行完整每日自动运营链路：

```powershell
npm.cmd run ops:daily
```

生成并推送每日站点更新：

```powershell
npm.cmd run ops:publish
```

注册每天晚上 20:00 自动生成、提交并推送站点更新：

```powershell
npm.cmd run ops:register-daily
```

输出文件：

- `data/watched-content.json`：公开信源追踪候选池。
- `data/ai-daily.json`：本地 AI 日报数据。
- `site/data/ai-daily.json`：网站前端读取的 AI 日报数据。
- `docs/operations/content-watch-report.md`：内容追踪报告。
- `docs/operations/ai-daily-report.md`：AI 日报报告。

## B站和抖音人工关注源

B站、抖音这类平台当前先作为人工关注源维护，不做越权抓取。配置位置：

```text
data/content-watch-config.json
```

如果要加入具体 B站 UP 主，在 `manual_creators` 中找到 `platform: bilibili` 的条目，然后把账号信息追加到 `profiles`，建议字段包括：

- `up_name`
- `uid`
- `space_url`
- `topic_tags`
- `last_checked_at`
- `notes`

后续如果你提供合法 API、RSS、导出 JSON/CSV 或用户授权数据，再把人工源升级为自动采集源。

## 下一步建议

1. 每次更新资源前先改 `data/resources.json`
2. 运行 `npm.cmd run ops:update` 同步站点数据并生成运营简报
3. 运行 `npm.cmd run preview` 本地预览
4. 需要自动化时运行 `npm.cmd run ops:register-daily` 注册每日 20:00 发布任务
5. 后面再接 RSS/API 数据源、GitHub、Cloudflare Pages、广告位和 SEO 页面
