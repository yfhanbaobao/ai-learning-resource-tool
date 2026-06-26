# LIGHT Content Watch Report

- Date: 2026-06-26
- New candidates: 0
- Coverage: partial
- Completed sources: 5/6
- Rate-limited sources: 0
- Warnings: 1
- Errors: 0

## Coverage

- Partial coverage: 5/6 sources completed; rate_limited=0; failed=0; warnings=1.
- Item retention: kept 20/20 existing items; partial coverage retention active; configured item cap deferred until a complete run.
- ok: openai_news results=12
- warning: huggingface_blog results=0 - https://huggingface.co/blog/feed.xml: fetch failed; UND_ERR_CONNECT_TIMEOUT; https://hf.co/blog/feed.xml: This operation was aborted
- no_results: github_trending_ai results=0
- no_results: hackernews_ai results=0
- no_results: github_side_hustle_templates results=0
- no_results: hackernews_side_projects results=0

## Priority

1. Watch public RSS/API sources only.
2. Normalize videos/articles/projects into candidate content.
3. Apply hard filters before feeding daily reports and resource pools.
4. Keep platforms without stable public APIs as manual watch sources.

## New Candidates

- No new accepted candidates from completed sources.
- This is not a confirmed no-result run because content-watch coverage was partial.
- Existing watched items are retained; item trimming waits for complete coverage.

## Manual Watch Sources

- LIGHT (douyin)
  - mode: manual
  - entry: https://v.douyin.com/
  - note: 抖音没有稳定公开 RSS/API，本地先作为人工关注源记录；后续如有合法 API 或导出文件再接入自动采集。
- B站 AI 创作者池 (bilibili)
  - mode: manual
  - entry: https://www.bilibili.com/
  - note: B站先作为人工关注源维护；可记录具体 UP 主主页、UID、分区和标签，后续如接入合法 API/RSS 或导出文件再自动采集。

## Rate Limits

- None.

## Warnings

- huggingface_blog: unavailable (https://huggingface.co/blog/feed.xml: fetch failed; UND_ERR_CONNECT_TIMEOUT; https://hf.co/blog/feed.xml: This operation was aborted); skipped optional source

## Errors

- None.

## Safety Boundary

- Only allowlisted HTTPS API/RSS URLs are requested.
- Only local JSON and Markdown reports are written.
- External code, commands, and scripts are never executed.
- Platform access limits are not bypassed.
