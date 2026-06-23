# AI 学习资源小工具每日自动运营架构

## 目标

把 AI 学习资源小工具从“本地静态页面”变成可持续更新的内容资产，为后续 SEO、资料包、联盟分销、咨询或课程导流做准备。

## 每日流程

1. 联网搜索：`npm.cmd run agent:resource-search`
2. 候选沉淀：搜索结果进入 `data/resources.json` 的 `candidate` 状态。
3. 日报筛选：`npm.cmd run agent:ai-daily`
4. 增长优化：`npm.cmd run agent:growth-ops`，把新信号转成首页、学习卡、内容和变现动作。
5. 公众号运营：`npm.cmd run agent:wechat-ops`，生成公众号文章草稿、关键词回复和 7 天内容排期。
6. 站点同步：`npm.cmd run ops:update`
7. 产物生成：更新 `site/data/resources.json`、`site/data/feed.json`、`site/data/growth-plan.json`、`site/data/wechat-ops-plan.json`、`site/sitemap.xml`、`docs/operations/daily-ops-report.md`、`docs/operations/market-research.md`、`docs/operations/growth-ops-report.md`、`docs/operations/wechat-ops-report.md`。
8. 人工审核：把高质量 candidate 改为 `active` 后再公开展示。
9. 日报汇总：由 `auto-creater/scripts/daily_profit_summary.py` 汇总进本地盈利项目日报。

## 安全边界

- 搜索智能体只访问 HTTPS allowlist：`api.github.com`、`hn.algolia.com`。
- 搜索结果不执行代码、不运行命令、不自动发布。
- 首页默认隐藏 `candidate` 资源。
- 任何新数据源必须先写入配置并经过人工确认。
- 邮件发送不在本项目内保存明文授权码，由 `auto-creater` 的加密密钥库统一管理。

## 变现路线

- 第一阶段：资源质量和教程覆盖，形成可索引内容。
- 第二阶段：把“本地 AI 工作流 + AI 副业启动页”打包成模板、清单、提示词和小工具。
- 第三阶段：用公众号/博客和小红书引流，再加入资料包下载、模板售卖、咨询入口。
- 第四阶段：根据转化数据选择最强赛道做付费产品。

## 每日检查指标

- 活跃资源数
- 候选资源数
- 分类覆盖数
- 高优先级资源数
- 新增资源质量
- 可改写成原创教程的资源数
- 变现入口准备度
