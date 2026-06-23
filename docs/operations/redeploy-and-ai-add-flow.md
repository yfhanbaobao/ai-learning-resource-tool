# 重新部署与 AI 添加资源流程说明

## 结论

重新部署网站不一定必须走自动化 AI 添加流程。

- UI、样式、部署配置、前端交互改动：直接走部署流程。
- 新增学习资源、联网搜索资源、批量更新资源数据：建议走自动化 AI 添加流程。
- 候选资源发布到首页：必须人工审核后把 `status` 改为 `active`。

## 两条流程的区别

| 场景 | 是否需要 AI 添加流程 | 应该运行什么 |
|---|---|---|
| 改首页布局、CSS、交互 | 不需要 | 本地预览 -> Git 提交 -> Cloudflare 部署 |
| 修复 Cloudflare 输出目录 | 不需要 | 检查 Pages/Workers 配置 -> 重新部署 |
| 更新 `site/data/resources.json` | 通常需要 | `npm.cmd run ops:update` |
| 联网找新 AI 学习资源 | 需要 | `npm.cmd run agent:resource-search` |
| 完整每日运营 | 需要 | `npm.cmd run ops:daily` |
| 把候选资源公开 | 需要人工审核 | 修改 `data/resources.json` 中 `status` 为 `active` 后运行 `ops:update` |

## 本地预览

```powershell
cd "D:\AI SPACE\ai-learning-resource-tool"
npm.cmd run preview:8080
```

打开：

```text
http://127.0.0.1:8080
```

## UI 改动后的部署流程

适合本次这类界面优化。

```powershell
cd "D:\AI SPACE\ai-learning-resource-tool"
npm.cmd run ops:update
git status --short
git add site/index.html site/styles.css site/app.js site/data-loader.js site/data/resources.json site/data/feed.json site/robots.txt site/sitemap.xml docs/operations/redeploy-and-ai-add-flow.md
git commit -m "Improve AI learning resource dashboard"
git push origin main
```

如果 GitHub Actions 已配置 Cloudflare Secrets，推送后会自动部署。

需要的 GitHub Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

如果 Secrets 没配置，Actions 会失败在 `Deploy to Cloudflare`。这时需要先到 GitHub 仓库 Settings -> Secrets and variables -> Actions 添加。

## Cloudflare Pages 必查配置

你当前线上预览地址出现过 `/data/resources.json` 返回首页 HTML 的情况，这通常表示输出目录或部署产物不对。

Cloudflare Pages 项目建议配置：

- Framework preset: None
- Build command: `npm run ops:update`
- Build output directory: `site`
- Root directory: 仓库根目录
- Production branch: `main`

部署后必须检查：

```text
https://你的域名/data/resources.json
https://你的域名/data/feed.json
https://你的域名/sitemap.xml
```

这三个地址应该分别返回 JSON、JSON、XML，不能返回首页 HTML。

## AI 添加资源流程

适合新增资源，不适合普通 UI 改版。

### 1. 联网搜索候选资源

```powershell
cd "D:\AI SPACE\ai-learning-resource-tool"
npm.cmd run agent:resource-search
```

搜索结果会写入 `data/resources.json`，默认应作为候选资源处理。

### 2. 人工审核

打开：

```text
D:\AI SPACE\ai-learning-resource-tool\data\resources.json
```

检查候选资源质量。确认可公开后，把对应资源改成：

```json
"status": "active"
```

不确定质量的资源保持：

```json
"status": "candidate"
```

### 3. 同步站点数据

```powershell
cd "D:\AI SPACE\ai-learning-resource-tool"
npm.cmd run ops:update
```

这会生成：

- `site/data/resources.json`
- `site/data/feed.json`
- `site/sitemap.xml`
- `site/robots.txt`
- `docs/operations/daily-ops-report.md`
- `docs/operations/market-research.md`

## 本次优化后必须验证

1. 首页标题应显示 `AI 学习资源运营台`。
2. 右侧运营状态应显示公开资源数、分类数、数据来源。
3. `/data/resources.json` 必须返回 JSON。
4. 搜索、分类、收藏、排序、复制提示词都能正常使用。
5. 移动端页面不能出现文字溢出或操作按钮重叠。

## 推荐日常节奏

- 每天：运行 `npm.cmd run ops:daily`，生成候选资源和运营报告。
- 每天：人工审核 3 条候选资源。
- 每周：把高频资源整理成原创学习路径或资料包。
- 每次 UI 改动：不走 AI 添加流程，直接本地预览和部署。
