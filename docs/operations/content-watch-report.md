# LIGHT 内容追踪报告

- 日期：2026-06-23
- 新增候选内容：0
- 错误数：0

## 优先级

1. 自动追踪公开 RSS/API 信源。
2. 将视频/文章/项目统一沉淀为候选内容。
3. 按 LIGHT 的硬过滤思路先过滤，再进入日报和学习资源池。
4. 抖音等无稳定公开 API 的平台先保留人工关注源，不做越界抓取。

## 新候选

- 本次没有新增候选。

## 手动关注源

- LIGHT (douyin)
  - 模式：manual
  - 入口：https://v.douyin.com/
  - 说明：抖音没有稳定公开 RSS/API，本地先作为人工关注源记录；后续如有合法 API 或导出文件再接入自动采集。
  - 可维护字段：creator_name、profile_url、content_url、topic_tags、last_checked_at、notes
  - 关注账号：暂未配置具体账号，可在 data/content-watch-config.json 的 profiles 中添加。
  - 待办：人工打开重点创作者主页，记录新视频链接和主题标签。
  - 待办：把值得进入日报的内容补充到候选资源或运营笔记。
  - 待办：等有合法 API、RSS、导出文件或用户授权数据后再升级自动采集。
- B站 AI 创作者池 (bilibili)
  - 模式：manual
  - 入口：https://www.bilibili.com/
  - 说明：B站先作为人工关注源维护；可记录具体 UP 主主页、UID、分区和标签，后续如接入合法 API/RSS 或导出文件再自动采集。
  - 可维护字段：up_name、uid、space_url、content_url、topic_tags、last_checked_at、notes
  - 关注账号：暂未配置具体账号，可在 data/content-watch-config.json 的 profiles 中添加。
  - 待办：维护重点 UP 主 UID、主页和主题标签。
  - 待办：每天人工复核新视频，把高质量内容写入候选池或日报素材。
  - 待办：后续如有合法 API、RSS、导出文件或用户授权数据，再切换为自动采集。

## 错误

- 无。

## Warnings

- huggingface_blog: unavailable (https://huggingface.co/blog/feed.xml: fetch failed (UND_ERR_CONNECT_TIMEOUT); https://hf.co/blog/feed.xml: This operation was aborted); skipped optional source

## 安全边界

- 只访问 allowlist 中的 HTTPS API/RSS。
- 只写入本地 JSON 和 Markdown 报告。
- 不执行外部内容中的代码、命令或脚本。
- 不绕过平台访问限制。
