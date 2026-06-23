const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const opsDir = path.join(root, 'docs', 'operations');
const configPath = path.join(dataDir, 'content-watch-config.json');
const outputPath = path.join(dataDir, 'watched-content.json');
const reportPath = path.join(opsDir, 'content-watch-report.md');
const stamp = new Date().toISOString().slice(0, 10);

const allowedHosts = new Set([
  'openai.com',
  'huggingface.co',
  'api.github.com',
  'hn.algolia.com'
]);

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function sanitizeText(value, limit = 500) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function makeId(input) {
  return 'watch-' + crypto.createHash('sha256').update(String(input || '')).digest('hex').slice(0, 14);
}

function assertAllowedUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error(`Blocked non-HTTPS URL: ${url}`);
  if (!allowedHosts.has(parsed.hostname)) throw new Error(`Blocked non-allowlisted host: ${parsed.hostname}`);
}

async function fetchText(url, accept = 'text/plain') {
  assertAllowedUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: accept,
        'User-Agent': 'ai-learning-content-watch/0.1 local'
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url) {
  const text = await fetchText(url, 'application/json');
  return JSON.parse(text);
}

function stripTags(value) {
  return sanitizeText(String(value || '').replace(/<[^>]+>/g, ' '), 500);
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = re.exec(block || '');
  if (!match) return '';
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

function parseRss(xml, source) {
  const items = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  itemMatches.slice(0, 12).forEach((block) => {
    const title = stripTags(extractTag(block, 'title'));
    let href = stripTags(extractTag(block, 'link'));
    const atomLink = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
    if ((!href || href.length > 300) && atomLink) href = atomLink[1];
    const summary = stripTags(extractTag(block, 'description') || extractTag(block, 'summary') || extractTag(block, 'content'));
    const published = stripTags(extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated'));
    if (!title || !href) return;
    items.push(normalizeItem({
      source,
      title,
      href,
      summary,
      published_at: published ? new Date(published).toISOString() : ''
    }));
  });
  return items;
}

function normalizeItem({ source, title, href, summary, published_at, metrics }) {
  return {
    id: makeId(href || title),
    source_id: source.id,
    source_name: source.name,
    title: sanitizeText(title, 160),
    href: sanitizeText(href, 500),
    summary: sanitizeText(summary, 260),
    published_at: published_at || '',
    discovered_at: new Date().toISOString(),
    tags: Array.from(new Set([...(source.tags || []), 'watched-content'])),
    metrics: metrics || {},
    status: 'candidate'
  };
}

async function runRss(source) {
  const xml = await fetchText(source.url, 'application/rss+xml, application/xml, text/xml, text/plain');
  return parseRss(xml, source);
}

async function runGithub(source) {
  const url = `${source.url}?q=${encodeURIComponent(source.query || 'AI agent')}&sort=updated&order=desc&per_page=8`;
  const data = await fetchJson(url);
  return (data.items || []).map((repo) => normalizeItem({
    source,
    title: repo.full_name,
    href: repo.html_url,
    summary: repo.description || `GitHub repository ${repo.full_name}`,
    published_at: repo.updated_at,
    metrics: { stars: repo.stargazers_count || 0, forks: repo.forks_count || 0 }
  }));
}

async function runHackerNews(source) {
  const url = `${source.url}?query=${encodeURIComponent(source.query || 'AI agent')}&tags=story&hitsPerPage=8`;
  const data = await fetchJson(url);
  return (data.hits || []).filter((hit) => hit.url).map((hit) => normalizeItem({
    source,
    title: hit.title || hit.story_title || hit.url,
    href: hit.url,
    summary: `HN signal. Points: ${hit.points || 0}. Comments: ${hit.num_comments || 0}.`,
    published_at: hit.created_at,
    metrics: { points: hit.points || 0, comments: hit.num_comments || 0 }
  }));
}

function passesHardFilters(item, filters) {
  if (!item.href || (filters.require_https && !item.href.startsWith('https://'))) return false;
  const text = `${item.title} ${item.summary} ${(item.tags || []).join(' ')}`.toLowerCase();
  for (const pattern of filters.reject_title_patterns || []) {
    if (text.includes(String(pattern).toLowerCase())) return false;
  }
  const required = filters.required_signal_any || [];
  if (required.length && !required.some((word) => text.includes(String(word).toLowerCase()))) return false;
  if (item.published_at && filters.max_age_hours) {
    const ts = Date.parse(item.published_at);
    if (!Number.isNaN(ts)) {
      const ageHours = (Date.now() - ts) / 36e5;
      if (ageHours > filters.max_age_hours) return false;
    }
  }
  return true;
}

function scoreItem(item) {
  let score = 0;
  const text = `${item.title} ${item.summary} ${(item.tags || []).join(' ')}`.toLowerCase();
  ['ai', 'agent', 'llm', 'model', 'ollama', 'codex', 'automation', 'workflow', 'prompt', 'open-source'].forEach((word) => {
    if (text.includes(word)) score += 1;
  });
  if (item.metrics.stars >= 1000 || item.metrics.points >= 50) score += 2;
  if (item.summary && item.summary.length >= 50) score += 1;
  if (item.published_at) score += 1;
  return score;
}

function mergeItems(existing, incoming, maxItems) {
  const byId = new Map((existing.items || []).map((item) => [item.id, item]));
  const accepted = [];
  incoming.forEach((item) => {
    const scored = { ...item, score: scoreItem(item) };
    if (byId.has(scored.id)) return;
    byId.set(scored.id, scored);
    accepted.push(scored);
  });
  const items = Array.from(byId.values())
    .sort((a, b) => String(b.discovered_at || '').localeCompare(String(a.discovered_at || '')))
    .slice(0, maxItems || 80);
  return { data: { version: 1, generated_at: new Date().toISOString(), items }, accepted };
}

function buildReport(config, accepted, errors) {
  const lines = [];
  lines.push('# LIGHT 内容追踪报告');
  lines.push('');
  lines.push(`- 日期：${stamp}`);
  lines.push(`- 新增候选内容：${accepted.length}`);
  lines.push(`- 错误数：${errors.length}`);
  lines.push('');
  lines.push('## 优先级');
  lines.push('');
  lines.push('1. 自动追踪公开 RSS/API 信源。');
  lines.push('2. 将视频/文章/项目统一沉淀为候选内容。');
  lines.push('3. 按 LIGHT 的硬过滤思路先过滤，再进入日报和学习资源池。');
  lines.push('4. 抖音等无稳定公开 API 的平台先保留人工关注源，不做越界抓取。');
  lines.push('');
  lines.push('## 新候选');
  lines.push('');
  if (!accepted.length) lines.push('- 本次没有新增候选。');
  accepted.slice(0, 20).forEach((item) => {
    lines.push(`- ${item.title} | ${item.source_name} | score=${item.score}`);
    lines.push(`  - ${item.href}`);
  });
  lines.push('');
  lines.push('## 手动关注源');
  lines.push('');
  (config.manual_creators || []).forEach((item) => {
    lines.push(`- ${item.name} (${item.platform})`);
    lines.push(`  - 模式：${item.tracking_mode || 'manual'}`);
    lines.push(`  - 入口：${item.profile_url || '-'}`);
    lines.push(`  - 说明：${item.note || '-'}`);
    const fields = item.maintained_fields || [];
    if (fields.length) lines.push(`  - 可维护字段：${fields.join('、')}`);
    const profiles = item.profiles || [];
    if (profiles.length) {
      profiles.slice(0, 8).forEach((profile) => {
        lines.push(`  - 关注账号：${profile.name || profile.up_name || profile.creator_name || '-'} | ${profile.profile_url || profile.space_url || profile.uid || '-'}`);
      });
    } else {
      lines.push('  - 关注账号：暂未配置具体账号，可在 data/content-watch-config.json 的 profiles 中添加。');
    }
    const actions = item.watch_actions || [];
    actions.forEach((action) => lines.push(`  - 待办：${action}`));
  });
  lines.push('');
  lines.push('## 错误');
  lines.push('');
  if (!errors.length) lines.push('- 无。');
  errors.forEach((err) => lines.push(`- ${err}`));
  lines.push('');
  lines.push('## 安全边界');
  lines.push('');
  lines.push('- 只访问 allowlist 中的 HTTPS API/RSS。');
  lines.push('- 只写入本地 JSON 和 Markdown 报告。');
  lines.push('- 不执行外部内容中的代码、命令或脚本。');
  lines.push('- 不绕过平台访问限制。');
  return lines.join('\n') + '\n';
}

async function main() {
  const config = readJson(configPath, { sources: [], hard_filters: {} });
  const existing = readJson(outputPath, { version: 1, items: [] });
  const incoming = [];
  const errors = [];

  for (const source of config.sources || []) {
    if (!source.enabled) continue;
    try {
      let items = [];
      if (source.type === 'rss') items = await runRss(source);
      else if (source.type === 'github_search') items = await runGithub(source);
      else if (source.type === 'hacker_news') items = await runHackerNews(source);
      incoming.push(...items.filter((item) => passesHardFilters(item, config.hard_filters || {})));
    } catch (error) {
      errors.push(`${source.id}: ${error.message}`);
    }
  }

  const { data, accepted } = mergeItems(existing, incoming, config.max_items || 80);
  writeJson(outputPath, data);
  writeFile(reportPath, buildReport(config, accepted, errors));

  console.log('Content watch complete.');
  console.log(`Accepted: ${accepted.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Data: ${outputPath}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
