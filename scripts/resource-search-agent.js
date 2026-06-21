const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const opsDir = path.join(root, 'docs', 'operations');
const resourcesPath = path.join(dataDir, 'resources.json');
const configPath = path.join(dataDir, 'search-config.json');
const stamp = new Date().toISOString().slice(0, 10);

const allowedHosts = new Set([
  'api.github.com',
  'hn.algolia.com'
]);

function readJson(filePath) {
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
  return 'candidate-' + crypto.createHash('sha256').update(input).digest('hex').slice(0, 14);
}

function assertAllowedUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error(`Blocked non-HTTPS URL: ${url}`);
  }
  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(`Blocked non-allowlisted host: ${parsed.hostname}`);
  }
}

async function fetchJson(url) {
  assertAllowedUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ai-learning-resource-agent/0.1 local'
      }
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function inferCategory(query, title) {
  const value = `${query} ${title}`.toLowerCase();
  if (value.includes('ollama')) return 'Ollama教程';
  if (value.includes('qwen') || value.includes('deepseek') || value.includes('coder')) return 'Qwen/DeepSeek代码模型';
  if (value.includes('prompt') || value.includes('vibe')) return '提示词库';
  if (value.includes('automation') || value.includes('script')) return '自动化脚本案例';
  if (value.includes('cloudflare') || value.includes('static')) return '免费大模型网站';
  return 'AI学习资源';
}

function scoreCandidate(item) {
  let score = 0;
  const text = `${item.title} ${item.summary} ${(item.tags || []).join(' ')}`.toLowerCase();
  ['ollama', 'qwen', 'deepseek', 'vibe', 'coding', 'automation', 'windows', 'local'].forEach((word) => {
    if (text.includes(word)) score += 1;
  });
  if (item.href && item.href.startsWith('https://')) score += 1;
  if (item.summary && item.summary.length > 40) score += 1;
  return score;
}

async function searchGithub(query, source) {
  const url = `${source.endpoint}?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=5`;
  const data = await fetchJson(url);
  return (data.items || []).map((repo) => {
    const href = repo.html_url;
    const title = sanitizeText(repo.full_name, 120);
    return {
      id: makeId(href),
      title,
      category: inferCategory(query, title),
      summary: sanitizeText(repo.description || `GitHub repository for ${title}`, 220),
      href,
      copyText: `请分析这个开源项目是否适合作为 AI 学习资源：${href}`,
      status: 'candidate',
      priority: 'review',
      tags: ['github', 'auto-discovered'],
      discovered_at: new Date().toISOString(),
      discovered_by: 'resource-search-agent',
      source_query: query
    };
  });
}

async function searchHackerNews(query, source) {
  const url = `${source.endpoint}?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`;
  const data = await fetchJson(url);
  return (data.hits || []).filter((hit) => hit.url).map((hit) => {
    const href = hit.url;
    const title = sanitizeText(hit.title || hit.story_title || href, 120);
    return {
      id: makeId(href),
      title,
      category: inferCategory(query, title),
      summary: sanitizeText(`Hacker News discussion signal. Points: ${hit.points || 0}. Comments: ${hit.num_comments || 0}.`, 220),
      href,
      copyText: `请判断这条 HN 资源是否适合 AI 学习资源站：${href}`,
      status: 'candidate',
      priority: 'review',
      tags: ['hacker-news', 'auto-discovered'],
      discovered_at: new Date().toISOString(),
      discovered_by: 'resource-search-agent',
      source_query: query
    };
  });
}

async function runSource(query, source) {
  if (!source.enabled) return [];
  if (source.type === 'github_repositories') return searchGithub(query, source);
  if (source.type === 'hacker_news_algolia') return searchHackerNews(query, source);
  return [];
}

function mergeCandidates(resourceData, candidates, maxCandidates) {
  const resources = resourceData.resources || [];
  const existingKeys = new Set(resources.map((item) => `${item.href || ''}|${item.title || ''}`.toLowerCase()));
  const byId = new Map(resources.map((item) => [item.id, item]));
  const accepted = [];

  candidates
    .map((item) => ({ ...item, score: scoreCandidate(item) }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .forEach((item) => {
      const key = `${item.href || ''}|${item.title || ''}`.toLowerCase();
      if (existingKeys.has(key)) return;
      if (byId.has(item.id)) return;
      accepted.push(item);
      existingKeys.add(key);
      byId.set(item.id, item);
    });

  const active = resources.filter((item) => item.status !== 'candidate');
  const oldCandidates = resources.filter((item) => item.status === 'candidate');
  const nextCandidates = [...accepted, ...oldCandidates]
    .sort((a, b) => String(b.discovered_at || '').localeCompare(String(a.discovered_at || '')))
    .slice(0, maxCandidates);

  return {
    resourceData: { ...resourceData, resources: [...active, ...nextCandidates] },
    accepted
  };
}

function buildReport(accepted, errors) {
  const lines = [];
  lines.push('# 联网资源搜索报告');
  lines.push('');
  lines.push(`- 生成日期：${stamp}`);
  lines.push(`- 新候选资源：${accepted.length}`);
  lines.push(`- 错误数：${errors.length}`);
  lines.push('');
  lines.push('## 新候选资源');
  lines.push('');
  if (!accepted.length) {
    lines.push('- 本次没有发现达到阈值的新候选资源。');
  } else {
    accepted.forEach((item) => {
      lines.push(`- ${item.title} [${item.category}] score=${item.score}`);
      lines.push(`  - ${item.href}`);
      lines.push(`  - query: ${item.source_query}`);
    });
  }
  lines.push('');
  lines.push('## 错误');
  lines.push('');
  if (!errors.length) {
    lines.push('- 无');
  } else {
    errors.forEach((err) => lines.push(`- ${err}`));
  }
  lines.push('');
  lines.push('## 安全策略');
  lines.push('');
  lines.push('- 只访问 allowlist 中的 HTTPS API。');
  lines.push('- 搜索结果只进入 candidate 候选池，不直接发布到首页。');
  lines.push('- 不执行抓取到的代码、命令或脚本。');
  lines.push('- 候选资源需要人工审核后再改为 active。');
  return lines.join('\n') + '\n';
}

async function main() {
  const config = readJson(configPath);
  const resourceData = readJson(resourcesPath);
  const allCandidates = [];
  const errors = [];

  for (const query of config.queries || []) {
    for (const source of config.sources || []) {
      try {
        const results = await runSource(query, source);
        allCandidates.push(...results);
      } catch (error) {
        errors.push(`${source.id}/${query}: ${error.message}`);
      }
    }
  }

  const { resourceData: nextData, accepted } = mergeCandidates(resourceData, allCandidates, config.max_candidates || 40);
  writeJson(resourcesPath, nextData);
  writeFile(path.join(opsDir, 'search-report.md'), buildReport(accepted, errors));

  console.log('Resource search complete.');
  console.log(`Accepted candidates: ${accepted.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Report: ${path.join(opsDir, 'search-report.md')}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
