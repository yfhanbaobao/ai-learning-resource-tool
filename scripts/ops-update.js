const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const siteDir = path.join(root, 'site');
const siteDataDir = path.join(siteDir, 'data');
const opsDir = path.join(root, 'docs', 'operations');

const today = new Date();
const stamp = today.toISOString().slice(0, 10);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(filePath, data) {
  writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || '未分类';
    acc[value] = acc[value] || [];
    acc[value].push(item);
    return acc;
  }, {});
}

function scoreResource(item) {
  let score = 0;
  if (item.title) score += 2;
  if (item.summary && item.summary.length >= 20) score += 2;
  if (item.href && item.href !== '#') score += 1;
  if (Array.isArray(item.tags) && item.tags.length >= 2) score += 1;
  if (item.priority === 'high') score += 1;
  return score;
}

function buildMarketResearch(resources, config) {
  const lanes = [
    {
      name: 'Windows 本地模型新手上手',
      saturation: '中低',
      why: '多数内容停留在工具介绍，缺少面向 Windows 用户的排错、模型选择和工作流闭环。',
      fit: '与现有 Ollama、Qwen、DeepSeek、部署资源高度匹配。'
    },
    {
      name: 'Vibe Coding 学习路径与模板',
      saturation: '中低',
      why: '泛提示词库很多，但“从需求到页面/脚本/部署”的可复制训练路径仍不足。',
      fit: '可用提示词模板、代码案例、自动化脚本案例形成系列内容。'
    },
    {
      name: 'AI 自动化脚本案例库',
      saturation: '低',
      why: '真实小任务脚本分散在博客和仓库里，缺少按难度、场景、可复制命令组织的中文入口。',
      fit: '适合做长尾 SEO 与资源订阅。'
    },
    {
      name: '本地 AI 工具运营导航',
      saturation: '中',
      why: '工具导航站拥挤，但面向“本地部署 + 学习 + 自动运营”的组合还不常见。',
      fit: '能与本项目自动更新、资源质检、日报生成形成差异。'
    }
  ];

  const lines = [];
  lines.push('# 市场调研：AI 学习资源小工具');
  lines.push('');
  lines.push(`- 生成日期：${stamp}`);
  lines.push(`- 定位：${config.positioning}`);
  lines.push(`- 目标用户：${config.target_audience}`);
  lines.push('');
  lines.push('## 未明显饱和的切入赛道');
  lines.push('');
  lines.push('| 赛道 | 饱和度 | 为什么还有机会 | 与当前项目匹配度 |');
  lines.push('| --- | --- | --- | --- |');
  lanes.forEach((lane) => {
    lines.push(`| ${lane.name} | ${lane.saturation} | ${lane.why} | ${lane.fit} |`);
  });
  lines.push('');
  lines.push('## 推荐主线');
  lines.push('');
  lines.push('优先选择“Windows 本地模型新手上手 + Vibe Coding 学习路径 + 自动化脚本案例库”的组合，不做泛泛 AI 工具导航。这个组合更容易形成可搜索、可复用、可持续更新的内容资产。');
  lines.push('');
  lines.push('## MVP 内容策略');
  lines.push('');
  lines.push('1. 每周新增 3 条可复制资源，必须包含命令、提示词或操作步骤。');
  lines.push('2. 每条资源至少归入一个学习路径：本地模型、代码模型、提示词、自动化、部署。');
  lines.push('3. 每次更新生成运营简报，记录新增资源、缺口和下一步内容选题。');
  lines.push('4. 广告和分销先预留位置，等有稳定访问后再接入。');
  lines.push('');
  lines.push('## 当前资源基础');
  lines.push('');
  const byCategory = groupBy(resources, 'category');
  Object.keys(byCategory).sort().forEach((category) => {
    lines.push(`- ${category}: ${byCategory[category].length} 条`);
  });
  lines.push('');
  return lines.join('\n') + '\n';
}

function buildOpsReport(resources) {
  const active = resources.filter((item) => !item.status || item.status === 'active');
  const candidates = resources.filter((item) => item.status === 'candidate');
  const byCategory = groupBy(active, 'category');
  const quality = active.map((item) => ({ id: item.id, title: item.title, score: scoreResource(item) }));
  const weak = quality.filter((item) => item.score < 5);

  const lines = [];
  lines.push('# 自动运营简报');
  lines.push('');
  lines.push(`- 生成日期：${stamp}`);
  lines.push(`- 活跃资源数：${active.length}`);
  lines.push(`- 候选资源数：${candidates.length}`);
  lines.push(`- 分类数：${Object.keys(byCategory).length}`);
  lines.push('');
  lines.push('## 分类分布');
  lines.push('');
  Object.keys(byCategory).sort().forEach((category) => {
    lines.push(`- ${category}: ${byCategory[category].length}`);
  });
  lines.push('');
  lines.push('## 资源质检');
  lines.push('');
  if (!weak.length) {
    lines.push('- 当前资源基础字段完整，暂无低分项。');
  } else {
    weak.forEach((item) => lines.push(`- ${item.title}: 质量分 ${item.score}/7，建议补链接、标签或摘要。`));
  }
  lines.push('');
  lines.push('## 下次更新建议');
  lines.push('');
  lines.push('- 增加 1 篇“RTX 2060 6G 本地模型选择”资源。');
  lines.push('- 增加 1 篇“Codex + Ollama 本地开发流”资源。');
  lines.push('- 增加 1 篇“静态站自动运营脚本”资源。');
  lines.push('');
  return lines.join('\n') + '\n';
}

function buildFeed(resources) {
  return {
    generated_at: today.toISOString(),
    items: resources
      .filter((item) => !item.status || item.status === 'active')
      .map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        summary: item.summary,
        href: item.href,
        tags: item.tags || []
      }))
  };
}

function buildSitemap(resources) {
  const urls = ['./', './about.html', './privacy.html', './disclaimer.html'];
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  urls.forEach((url) => {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(url)}</loc>`);
    lines.push(`    <lastmod>${stamp}</lastmod>`);
    lines.push('  </url>');
  });
  lines.push('</urlset>');
  return lines.join('\n') + '\n';
}

function main() {
  const resourceData = readJson(path.join(dataDir, 'resources.json'));
  const config = readJson(path.join(dataDir, 'site-config.json'));
  const resources = resourceData.resources || [];

  fs.mkdirSync(siteDataDir, { recursive: true });
  fs.mkdirSync(opsDir, { recursive: true });

  writeJson(path.join(siteDataDir, 'resources.json'), resourceData);
  writeJson(path.join(siteDataDir, 'feed.json'), buildFeed(resources));
  writeFile(path.join(siteDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ./sitemap.xml\n');
  writeFile(path.join(siteDir, 'sitemap.xml'), buildSitemap(resources));
  writeFile(path.join(opsDir, 'market-research.md'), buildMarketResearch(resources, config));
  writeFile(path.join(opsDir, 'daily-ops-report.md'), buildOpsReport(resources));
  writeFile(path.join(opsDir, 'update-log.md'), `# 更新记录\n\n- ${stamp}: 生成站点数据、研究报告、运营简报、feed、robots 和 sitemap。\n`);

  console.log('Operations update complete.');
  console.log(`Resources: ${resources.length}`);
  console.log(`Site data: ${path.join(siteDataDir, 'resources.json')}`);
  console.log(`Ops report: ${path.join(opsDir, 'daily-ops-report.md')}`);
}

main();
