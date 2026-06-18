# AI 学习资源小工具

这个目录是我先帮你搭好的本地工作区，目标是服务你后面做一个“AI 学习资源整合站”。

当前已经准备好的内容：
- 本地环境检查脚本
- 本地预览脚本
- 账号注册清单文档
- 手动安装与部署准备文档
- 一个可直接本地打开和预览的静态网页骨架

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
powershell -ExecutionPolicy Bypass -File .\scripts\start-preview.ps1
```

如果你想走 `npm` 脚本，不要直接敲 `npm`，这台机器当前 PowerShell 策略会拦截 `npm.ps1`。请改用：

```powershell
npm.cmd run check:env
npm.cmd run preview
```

## 下一步建议

1. 先按 `docs/03-手动安装与部署准备.md` 补装 `Git` 和 `Ollama`
2. 按 `docs/02-账号注册清单.md` 开始注册账号
3. 确认本地环境没问题后，我可以继续帮你把这个静态骨架升级成可上线版本
4. 后面我们再接 `GitHub`、`Cloudflare Pages`、广告位、SEO 页面
