const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const siteDataDir = path.join(root, 'site', 'data');
const docsDir = path.join(root, 'docs');
const contentDir = path.join(docsDir, 'content', 'wechat');
const opsDir = path.join(docsDir, 'operations');
const stamp = new Date().toISOString().slice(0, 10);

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

function clean(value, limit = 240) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function firstUsefulSignal(daily) {
  const selected = Array.isArray(daily.selected) ? daily.selected : [];
  return selected.find((item) => /learning|course|prompt|workflow|codex|automation|vibe|agent/i.test(`${item.title || ''} ${item.summary || ''} ${(item.tags || []).join(' ')}`))
    || selected[0]
    || null;
}

function buildTitle(plan) {
  const focus = plan.summary && plan.summary.recommended_focus
    ? plan.summary.recommended_focus.label
    : 'AI 副业启动页';
  if (/副业/.test(focus)) return 'Windows 新手如何用 7 天做出第一个 AI 副业启动页';
  return '从 0 跑通本地 AI，并做出一个能发布的小页面';
}

function buildArticle({ config, strategy, plan, signal }) {
  const product = config.product || {};
  const account = config.account || {};
  const title = buildTitle(plan);
  const keyword = product.free_entry_keyword || '资料包';
  const productName = product.name || 'ai学习资料大礼包';
  const price = product.test_price || '2.99';
  const officialAccountName = account.official_account_name || '待填写';
  const wechatId = account.wechat_id || '待填写';
  const signalLine = signal
    ? `今天我从资源追踪里看到一个很强的信号：${clean(signal.title, 120)}。它提醒我，AI 学习最容易失败的地方不是工具不够多，而是没有把工具变成一个可发布的小结果。`
    : '今天的方向很明确：先不要追大而全的 AI 副业项目，先做一个能发布、能被别人看见、能收集反馈的小页面。';

  return `# ${title}

> 公众号草稿日期：${stamp}
> 资料包：${productName}
> 免费入口：公众号回复“${keyword}”
> 低价测试包：${price} 元

## 开头

如果你是 Windows 新手，或者只是会用一点 ChatGPT、豆包、Kimi，但不知道怎么把 AI 变成一个能发布的小项目，我建议你先别急着做课程、社群或复杂产品。

先做两件事：

1. 跑通本地 AI 环境。
2. 做出一个 AI 副业启动页。

这两件事完成之前，不要急着买一堆模板，也不要急着上陪跑服务。先拿到一个真实可展示的结果。

${signalLine}

## 第一步：跑通本地 AI 环境

你先确认这些命令能正常运行：

\`\`\`powershell
node --version
npm.cmd -v
git --version
ollama --version
\`\`\`

如果你已经安装 Ollama，可以继续检查模型：

\`\`\`powershell
ollama list
ollama pull qwen2.5:7b
\`\`\`

这一阶段的目标不是研究所有模型，而是确认你能在自己的电脑上稳定使用 AI，并且能让 AI 帮你写页面、改文案、排错。

## 第二步：做一个 AI 副业启动页

启动页不需要复杂，第一版只要 7 个模块：

1. 首屏一句话承诺
2. 适合谁
3. 你会拿到什么
4. 7 天最小路线
5. 领取入口
6. 常见问题
7. 免责声明

你可以用这条提示词开始：

\`\`\`text
请先不要写代码，先帮我澄清目标用户、核心痛点、最小交付物、页面模块和不能写的承诺。
\`\`\`

然后再让 AI 生成页面：

\`\`\`text
请生成一个适合 Cloudflare Pages 的纯静态 AI 副业启动页，要求移动端优先、文案克制、结构清晰。页面目标是让用户关注公众号并领取 ai学习资料大礼包。
\`\`\`

## 第三步：什么时候再考虑付费包

我的建议是：

- 没跑通本地 AI 环境前，不要买升级包。
- 没做出启动页前，不要买内容引流模板。
- 完成本地环境和启动页后，再考虑 ${price} 元低价测试包。

${productName} 的低价测试包会补这些内容：

- 启动页文案模板
- Vibe Coding 提示词
- 常见报错修复提示词
- 公众号/小红书/B站内容模板

## 领取方式

关注公众号，回复：

\`\`\`text
${keyword}
\`\`\`

就可以领取 ${productName} 的免费入口。

如果你已经完成本地 AI 环境和启动页，但卡在页面上线、内容发布或资料包设计，可以通过微信或公众号私信联系我。

当前公众号名称：${officialAccountName}

当前微信号：${wechatId}

## 结尾

AI 副业不要从“大项目”开始。

先跑通环境，再做一个能发布的页面。你有了第一个结果，后面的内容引流、资料包、模板包和咨询服务才有意义。
`;
}

function buildAutoReplies(config) {
  const product = config.product || {};
  const account = config.account || {};
  const productName = product.name || 'ai学习资料大礼包';
  const keyword = product.free_entry_keyword || '资料包';
  const price = product.test_price || '2.99';
  const wechatId = account.wechat_id || '待填写';

  return {
    generated_at: new Date().toISOString(),
    replies: [
      {
        keyword,
        reply: `已收到。你可以先按顺序完成两步：1）跑通本地 AI 环境；2）做出 AI 副业启动页。完成后再考虑 ${price} 元低价测试包。`
      },
      {
        keyword: '环境',
        reply: '先检查 4 条命令：node --version、npm.cmd -v、git --version、ollama --version。任意一步报错，都把报错截图或文字发来。'
      },
      {
        keyword: '启动页',
        reply: '启动页第一版只做 7 个模块：首屏承诺、适合谁、你会拿到什么、7 天路线、领取入口、FAQ、免责声明。先做出来，再优化。'
      },
      {
        keyword: price,
        reply: `${productName} 低价测试包是 ${price} 元。建议你先完成本地环境和启动页，再购买升级内容，这样最不浪费。`
      },
      {
        keyword: '微信',
        reply: `可以加微信沟通：${wechatId}。如果微信号还没公开，请先通过公众号私信说明你的卡点。`
      },
      {
        keyword: '卡点',
        reply: '请按这个格式发我：你做到哪一步、报错/卡点是什么、你想完成什么结果、你已经试过什么。我会优先判断下一步最小动作。'
      }
    ]
  };
}

function buildCalendar(config) {
  const productName = (config.product && config.product.name) || 'ai学习资料大礼包';
  return [
    {
      day: 1,
      title: 'Windows 新手如何用 7 天做出第一个 AI 副业启动页',
      cta: `公众号回复“资料包”，领取 ${productName} 免费入口`
    },
    {
      day: 2,
      title: '本地 AI 环境跑不通？先检查这 4 条命令',
      cta: '回复“环境”，拿检查顺序'
    },
    {
      day: 3,
      title: '别先做大项目，先做一个能发布的小页面',
      cta: '回复“启动页”，拿页面结构'
    },
    {
      day: 4,
      title: '我为什么把 AI 副业第一步定成启动页',
      cta: '回复“资料包”，拿免费入口'
    },
    {
      day: 5,
      title: 'AI 启动页最容易写错的 5 个承诺',
      cta: '回复“卡点”，描述你的页面问题'
    },
    {
      day: 6,
      title: '2.99 元测试包适合谁，不适合谁',
      cta: '先完成环境和启动页，再考虑低价包'
    },
    {
      day: 7,
      title: '一周复盘：从本地 AI 到第一个可发布页面',
      cta: '回复“微信”，获取进一步沟通方式'
    }
  ];
}

function buildReport(plan, draftPath, repliesPath) {
  const offer = plan.config.product || {};
  const account = plan.config.account || {};
  const lines = [];
  lines.push('# 公众号运营智能体报告');
  lines.push('');
  lines.push(`- 生成时间：${plan.generated_at}`);
  lines.push(`- 资料包：${offer.name}`);
  lines.push(`- 免费入口：公众号回复“${offer.free_entry_keyword}”`);
  lines.push(`- 低价测试价：${offer.test_price} 元`);
  lines.push(`- 联系方式：微信 + 公众号私信`);
  lines.push(`- 公众号名称：${account.official_account_name}`);
  lines.push(`- 微信号：${account.wechat_id}`);
  lines.push('');
  lines.push('## 今日产物');
  lines.push('');
  lines.push(`- 公众号文章草稿：${draftPath}`);
  lines.push(`- 自动回复话术：${repliesPath}`);
  lines.push('');
  lines.push('## 7 天内容排期');
  lines.push('');
  plan.calendar.forEach((item) => {
    lines.push(`${item.day}. ${item.title}`);
    lines.push(`   - CTA：${item.cta}`);
  });
  lines.push('');
  lines.push('## 发布前检查');
  lines.push('');
  lines.push('- [ ] 填写真实公众号名称');
  lines.push('- [ ] 填写真实微信号或二维码');
  lines.push('- [ ] 确认 2.99 元收款方式');
  lines.push('- [ ] 把文章草稿复制到公众号后台');
  lines.push('- [ ] 配置关键词自动回复：资料包、环境、启动页、2.99、微信、卡点');
  lines.push('- [ ] 发布后记录阅读、关注、私信、领取、付费信号');
  lines.push('');
  lines.push('## 边界');
  lines.push('');
  lines.push('- 先生成可发布草稿和回复话术；不使用账号密码，不越权登录公众号后台。');
  lines.push('- 后续如提供公众号 API/账号权限，再把 draft_bundle 升级为自动草稿或自动发布流程。');
  return lines.join('\n') + '\n';
}

function main() {
  const config = readJson(path.join(dataDir, 'wechat-ops-config.json'), {});
  const strategy = readJson(path.join(dataDir, 'growth-strategy.json'), {});
  const growthPlan = readJson(path.join(dataDir, 'growth-plan.json'), {});
  const daily = readJson(path.join(dataDir, 'ai-daily.json'), { selected: [] });
  const signal = firstUsefulSignal(daily);
  const article = buildArticle({ config, strategy, plan: growthPlan, signal });
  const replies = buildAutoReplies(config);
  const calendar = buildCalendar(config);

  const draftPath = path.join(contentDir, `${stamp}-ai-side-hustle-starter-wechat-draft.md`);
  const repliesPath = path.join(contentDir, `${stamp}-wechat-auto-replies.json`);
  const plan = {
    generated_at: new Date().toISOString(),
    config,
    strategy: {
      positioning: strategy.positioning,
      stage_gate: strategy.stage_gate,
      commercial_offer: strategy.commercial_offer
    },
    selected_signal: signal ? {
      title: signal.title,
      href: signal.href,
      score: signal.daily_score || signal.score || 0
    } : null,
    draft_path: draftPath,
    replies_path: repliesPath,
    calendar
  };

  writeFile(draftPath, article);
  writeJson(repliesPath, replies);
  writeJson(path.join(dataDir, 'wechat-ops-plan.json'), plan);
  writeJson(path.join(siteDataDir, 'wechat-ops-plan.json'), plan);
  writeFile(path.join(opsDir, 'wechat-ops-report.md'), buildReport(plan, draftPath, repliesPath));

  console.log('WeChat ops complete.');
  console.log(`Draft: ${draftPath}`);
  console.log(`Replies: ${repliesPath}`);
  console.log(`Report: ${path.join(opsDir, 'wechat-ops-report.md')}`);
}

main();
