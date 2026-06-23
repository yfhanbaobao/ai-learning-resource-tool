const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const siteDataDir = path.join(root, 'site', 'data');
const opsDir = path.join(root, 'docs', 'operations');
const stamp = new Date().toISOString().slice(0, 10);

const tracks = [
  {
    id: 'local_ai_workflow',
    label: '从 0 跑通本地 AI 工作流',
    signals: ['ollama', 'windows', 'qwen', 'deepseek', '本地模型', 'vscode', 'cursor', 'codex']
  },
  {
    id: 'vibe_project',
    label: '用 AI 做出可交付小项目',
    signals: ['vibe', 'coding', 'prompt', '提示词', 'template', '模板', 'react', 'mvp', '脚本', '自动化', 'project']
  },
  {
    id: 'side_hustle_starter',
    label: 'AI 副业启动页与资料包',
    signals: ['副业', 'side hustle', 'startup', 'landing', '启动页', '资料包', '提示词包', '变现', 'monetization', '小红书', '公众号']
  },
  {
    id: 'ops_automation',
    label: '自动运营 AI 资源库',
    signals: ['automation', 'workflow', 'daily', 'ops', 'rss', 'feed', '自动运营', '日报', '采集', '运营']
  }
];

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(filePath, data) {
  writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

function clean(value, limit = 220) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function textFor(item) {
  return [
    item.title,
    item.category,
    item.summary,
    item.copyText,
    ...(Array.isArray(item.tags) ? item.tags : [])
  ].filter(Boolean).join(' ').toLowerCase();
}

function trackHits(item) {
  const text = textFor(item);
  return tracks
    .map((track) => ({
      id: track.id,
      label: track.label,
      hits: track.signals.filter((signal) => text.includes(signal.toLowerCase())).length
    }))
    .filter((track) => track.hits > 0);
}

function countByTrack(resources) {
  const counts = Object.fromEntries(tracks.map((track) => [track.id, 0]));
  resources.forEach((item) => {
    const hits = trackHits(item);
    hits.forEach((track) => {
      counts[track.id] += 1;
    });
  });
  return counts;
}

function topResourcesForTrack(resources, trackId, limit = 3) {
  return resources
    .map((item) => {
      const hit = trackHits(item).find((track) => track.id === trackId);
      return { item, score: hit ? hit.hits : 0 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || String(a.item.title || '').localeCompare(String(b.item.title || ''), 'zh-CN'))
    .slice(0, limit)
    .map((entry) => ({
      title: entry.item.title,
      category: entry.item.category,
      href: entry.item.href,
      priority: entry.item.priority || 'normal'
    }));
}

function buildGaps(strategy, activeResources) {
  const counts = countByTrack(activeResources);
  const targets = strategy.track_targets || {};
  return tracks.map((track) => {
    const current = counts[track.id] || 0;
    const target = targets[track.id] || 4;
    return {
      id: track.id,
      label: track.label,
      current,
      target,
      gap: Math.max(0, target - current),
      status: current >= target ? 'healthy' : 'needs-work'
    };
  });
}

function buildDailySignals(daily) {
  const selected = Array.isArray(daily.selected) ? daily.selected : [];
  return selected.slice(0, 5).map((item) => ({
    title: clean(item.title, 120),
    source: clean(item.source_name || item.origin || 'unknown', 80),
    next_action: clean(item.next_action, 180),
    score: item.daily_score || item.score || 0,
    href: item.href || ''
  }));
}

function chooseFocus(gaps) {
  const primaryOrder = ['local_ai_workflow', 'vibe_project', 'side_hustle_starter', 'ops_automation'];
  const sorted = [...gaps].sort((a, b) => {
    if (b.gap !== a.gap) return b.gap - a.gap;
    return primaryOrder.indexOf(a.id) - primaryOrder.indexOf(b.id);
  });
  return sorted[0] || gaps[0];
}

function buildActions(strategy, focus, signals) {
  const offer = strategy.commercial_offer || {};
  const productName = offer.product_name || 'AI 副业启动包';
  const price = offer.test_price ? `${offer.test_price} 元` : '低价';
  const actions = [
    {
      lane: '首页',
      action: `把首屏承诺改成“跑通本地 AI 工作流，并做出一个可发布的 AI 副业启动页”，同时承接到“${productName}”。`,
      output: '首页 H1、副标题、主 CTA 和学习路径文案'
    },
    {
      lane: '学习卡',
      action: '新增 1 张闭环学习卡：环境准备、项目步骤、验收清单、可复制提示词。',
      output: '1 张可公开展示的项目学习卡'
    },
    {
      lane: '内容',
      action: `写 1 篇公众号/博客长文，再拆成 1 条小红书笔记，结尾引导到“${offer.primary_cta || '免费入口'}”。`,
      output: '长文标题、三段式教程、小红书封面标题和公众号领取 CTA'
    },
    {
      lane: '变现',
      action: `沉淀第一版资料包目录，但只在用户完成本地环境和启动页后推荐 ${price} 测试包或咨询。`,
      output: '资料包目录、阶段门槛、推荐时机、2.99 测试价和联系渠道'
    }
  ];

  if (focus.id === 'side_hustle_starter') {
    actions.unshift({
      lane: '副业启动页',
      action: '优先补“个人 AI 副业启动页”分类，避免站点只像技术资源导航。',
      output: '副业启动页案例、变现路径卡、内容分发清单'
    });
  }

  if (signals.length) {
    actions.push({
      lane: '日报转化',
      action: `从今日高分信号中选 1 条改写成学习卡：${signals[0].title}`,
      output: '1 张学习卡或 1 篇短教程'
    });
  }

  return actions.map((item, index) => ({ id: index + 1, ...item }));
}

function buildPlan(strategy, resourcesData, daily) {
  const resources = Array.isArray(resourcesData.resources) ? resourcesData.resources : [];
  const activeResources = resources.filter((item) => !item.status || item.status === 'active');
  const candidates = resources.filter((item) => item.status === 'candidate');
  const gaps = buildGaps(strategy, activeResources);
  const focus = chooseFocus(gaps);
  const dailySignals = buildDailySignals(daily);

  return {
    generated_at: new Date().toISOString(),
    strategy,
    summary: {
      active_resources: activeResources.length,
      candidate_resources: candidates.length,
      recommended_focus: focus
    },
    tracks: gaps.map((gap) => ({
      ...gap,
      top_resources: topResourcesForTrack(activeResources, gap.id)
    })),
    daily_signals: dailySignals,
    actions: buildActions(strategy, focus, dailySignals),
    next_review_at: `${stamp} 23:00`
  };
}

function buildMarkdown(plan) {
  const lines = [];
  lines.push('# 增长运营优化报告');
  lines.push('');
  lines.push(`- 生成时间：${plan.generated_at}`);
  lines.push(`- 定位：${plan.strategy.positioning}`);
  lines.push(`- 活跃资源：${plan.summary.active_resources}`);
  lines.push(`- 候选资源：${plan.summary.candidate_resources}`);
  lines.push(`- 今日建议聚焦：${plan.summary.recommended_focus.label}`);
  lines.push('');
  lines.push('## 当前策略');
  lines.push('');
  lines.push(`- 第一阶段交付物：${plan.strategy.first_deliverable}`);
  lines.push(`- 运营节奏：${plan.strategy.operating_cadence}`);
  lines.push(`- 渠道：${plan.strategy.content_channels.join('、')}`);
  lines.push(`- 变现路线：${plan.strategy.monetization_route.join(' -> ')}`);
  lines.push('');
  if (plan.strategy.commercial_offer) {
    const offer = plan.strategy.commercial_offer;
    lines.push('## 商业细节');
    lines.push('');
    lines.push(`- 资料包名：${offer.product_name}`);
    lines.push(`- 免费入口：${offer.free_entry}`);
    lines.push(`- 低价测试价：${offer.test_price} ${offer.currency || ''}`.trim());
    lines.push(`- 联系方式：${(offer.contact_channels || []).join('、')}`);
    lines.push(`- 主 CTA：${offer.primary_cta}`);
    lines.push(`- 付费 CTA：${offer.paid_cta}`);
    if (offer.account_placeholders) {
      lines.push(`- 账号：公众号名称=${offer.account_placeholders.official_account_name}；微信号=${offer.account_placeholders.wechat_id}`);
    }
    lines.push('');
  }
  if (plan.strategy.stage_gate) {
    lines.push('## 阶段解锁规则');
    lines.push('');
    lines.push(`- 规则：${plan.strategy.stage_gate.rule}`);
    lines.push(`- 先完成：${(plan.strategy.stage_gate.required_before_upsell || []).join('、')}`);
    lines.push(`- 完成后再推荐：${(plan.strategy.stage_gate.recommended_after_completion || []).join('、')}`);
    lines.push(`- 完成前避免：${(plan.strategy.stage_gate.avoid_before_completion || []).join('、')}`);
    lines.push('');
  }
  lines.push('## 赛道覆盖');
  lines.push('');
  lines.push('| 方向 | 当前 | 目标 | 状态 |');
  lines.push('| --- | ---: | ---: | --- |');
  plan.tracks.forEach((track) => {
    lines.push(`| ${track.label} | ${track.current} | ${track.target} | ${track.status} |`);
  });
  lines.push('');
  lines.push('## 今日优化动作');
  lines.push('');
  plan.actions.forEach((item) => {
    lines.push(`${item.id}. ${item.lane}：${item.action}`);
    lines.push(`   - 产出：${item.output}`);
  });
  lines.push('');
  lines.push('## 可优先复用的资源');
  lines.push('');
  plan.tracks.forEach((track) => {
    lines.push(`### ${track.label}`);
    if (!track.top_resources.length) {
      lines.push('- 暂无足够匹配资源，建议下一轮检索补齐。');
    } else {
      track.top_resources.forEach((item) => {
        lines.push(`- ${clean(item.title, 100)}（${clean(item.category, 50)}）`);
      });
    }
    lines.push('');
  });
  lines.push('## 日报信号');
  lines.push('');
  if (!plan.daily_signals.length) {
    lines.push('- 今天没有可用日报信号。');
  } else {
    plan.daily_signals.forEach((item) => {
      lines.push(`- ${item.title} | ${item.source} | score=${item.score}`);
      lines.push(`  - 下一步：${item.next_action}`);
    });
  }
  lines.push('');
  return lines.join('\n') + '\n';
}

function main() {
  const strategy = readJson(path.join(dataDir, 'growth-strategy.json'), {});
  const resourcesData = readJson(path.join(dataDir, 'resources.json'), { resources: [] });
  const daily = readJson(path.join(dataDir, 'ai-daily.json'), { selected: [] });
  const plan = buildPlan(strategy, resourcesData, daily);

  writeJson(path.join(dataDir, 'growth-plan.json'), plan);
  writeJson(path.join(siteDataDir, 'growth-plan.json'), plan);
  writeFile(path.join(opsDir, 'growth-ops-report.md'), buildMarkdown(plan));

  console.log('Growth ops complete.');
  console.log(`Focus: ${plan.summary.recommended_focus.label}`);
  console.log(`Report: ${path.join(opsDir, 'growth-ops-report.md')}`);
}

main();
