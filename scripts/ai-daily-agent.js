const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const siteDir = path.join(root, 'site');
const siteDataDir = path.join(siteDir, 'data');
const opsDir = path.join(root, 'docs', 'operations');
const stamp = new Date().toISOString().slice(0, 10);

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

function clean(value, limit = 360) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function itemTime(item) {
  return Date.parse(item.published_at || item.discovered_at || item.updated_at || '') || 0;
}

function dedupe(items) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const key = `${item.href || ''}|${item.title || ''}`.toLowerCase();
    if (!key.trim() || seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
}

function passesSevenRules(item, recentIds) {
  const href = String(item.href || '');
  const title = clean(item.title, 200);
  const summary = clean(item.summary, 500);
  const text = `${title} ${summary} ${(item.tags || []).join(' ')}`.toLowerCase();
  const when = item.published_at || item.discovered_at || '';
  return {
    fresh: !when || Date.now() - itemTime(item) <= 14 * 24 * 60 * 60 * 1000,
    source: href.startsWith('https://'),
    real_project: !/awesome-list|bookmark dump|link collection/i.test(text) || /workflow|template|tool|model|agent/i.test(text),
    real_metric: !/(1k\+|上千|很多|大量)/i.test(text),
    complete: !!(title && href && (summary || item.source_name)),
    date_traceable: !!(when || item.discovered_at),
    not_duplicate: !recentIds.has(item.id)
  };
}

function ruleScore(rules) {
  return Object.values(rules).filter(Boolean).length;
}

function normalizeFromResource(item) {
  return {
    id: item.id,
    title: item.title,
    href: item.href,
    summary: item.summary,
    category: item.category,
    tags: item.tags || [],
    source_name: item.discovered_by || 'learning-resource-tool',
    discovered_at: item.discovered_at || '',
    priority: item.priority,
    origin: 'resource'
  };
}

function normalizeFromWatch(item) {
  return {
    id: item.id,
    title: item.title,
    href: item.href,
    summary: item.summary,
    category: (item.tags || [])[0] || 'AI 信源追踪',
    tags: item.tags || [],
    source_name: item.source_name,
    published_at: item.published_at || '',
    discovered_at: item.discovered_at || '',
    metrics: item.metrics || {},
    score: item.score || 0,
    origin: 'watch'
  };
}

function buildDaily(resources, watched) {
  const resourceItems = (resources.resources || [])
    .filter((item) => item.status === 'candidate' || item.discovered_by)
    .map(normalizeFromResource);
  const watchedItems = (watched.items || []).map(normalizeFromWatch);
  const recentIds = new Set();
  const all = dedupe([...watchedItems, ...resourceItems])
    .sort((a, b) => itemTime(b) - itemTime(a));

  const evaluated = all.map((item) => {
    const rules = passesSevenRules(item, recentIds);
    recentIds.add(item.id);
    const score = ruleScore(rules) + (item.score || 0);
    return { ...item, rules, daily_score: score };
  });

  const selected = evaluated
    .filter((item) => ruleScore(item.rules) >= 5)
    .sort((a, b) => b.daily_score - a.daily_score || itemTime(b) - itemTime(a))
    .slice(0, 7);

  return {
    generated_at: new Date().toISOString(),
    title: `AI 日报 ${stamp}`,
    summary: `今日筛选 ${selected.length} 条 AI 学习/自动化相关信号，来源于公开 allowlist 信源和本地候选资源池。`,
    selected,
    evaluated_count: evaluated.length,
    rules: [
      '14 天时效',
      'HTTPS 来源可信',
      '排除纯链接合集或空泛列表',
      '拒绝虚假指标表达',
      '标题/来源/摘要信息完整',
      '日期可追踪',
      '近 7 条去重'
    ]
  };
}

function buildMarkdown(daily) {
  const lines = [];
  lines.push(`# ${daily.title}`);
  lines.push('');
  lines.push(`- 生成时间：${daily.generated_at}`);
  lines.push(`- 候选评估数：${daily.evaluated_count}`);
  lines.push(`- 入选数：${daily.selected.length}`);
  lines.push('');
  lines.push('## 今日重点');
  lines.push('');
  if (!daily.selected.length) lines.push('- 今天没有达到过滤阈值的内容。');
  daily.selected.forEach((item, index) => {
    lines.push(`${index + 1}. ${clean(item.title, 120)}`);
    lines.push(`   - 来源：${clean(item.source_name || item.origin, 80)}`);
    lines.push(`   - 摘要：${clean(item.summary || '暂无摘要', 260)}`);
    lines.push(`   - 链接：${item.href}`);
    lines.push(`   - 评分：${item.daily_score}`);
  });
  lines.push('');
  lines.push('## 7 条硬规则');
  lines.push('');
  daily.rules.forEach((rule) => lines.push(`- ${rule}`));
  lines.push('');
  lines.push('## 下一步运营动作');
  lines.push('');
  lines.push('- 把高分候选资源复核后改为 active，再运行 `npm.cmd run ops:update`。');
  lines.push('- 将今日重点中的教程/开源项目改写成可复制学习卡片。');
  lines.push('- 对连续出现的主题增加专题页或学习路径。');
  return lines.join('\n') + '\n';
}

function main() {
  const resources = readJson(path.join(dataDir, 'resources.json'), { resources: [] });
  const watched = readJson(path.join(dataDir, 'watched-content.json'), { items: [] });
  const daily = buildDaily(resources, watched);

  writeJson(path.join(dataDir, 'ai-daily.json'), daily);
  writeJson(path.join(siteDataDir, 'ai-daily.json'), daily);
  writeFile(path.join(opsDir, 'ai-daily-report.md'), buildMarkdown(daily));

  console.log('AI daily complete.');
  console.log(`Selected: ${daily.selected.length}`);
  console.log(`Report: ${path.join(opsDir, 'ai-daily-report.md')}`);
}

main();
