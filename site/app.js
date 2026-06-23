const defaultCopyLabel = '复制提示词';
const compactDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit'
});

let resources = [
  {
    id: 'ollama-windows-fix',
    title: 'Ollama Windows 部署排错',
    category: 'Ollama教程',
    summary: '适合首页首批内容：安装、启动失败、端口占用、模型拉取慢、环境变量等常见问题。',
    href: 'https://ollama.com',
    copyText: 'ollama --version\nollama list\nollama pull qwen2.5:7b',
    status: 'active',
    priority: 'high',
    tags: ['ollama', 'windows', '本地模型']
  },
  {
    id: 'ollama-cursor-link',
    title: 'Ollama 对接 Cursor / VS Code 思路',
    category: 'Ollama教程',
    summary: '整理本地模型如何给编辑器或代码工作流提供补全、问答和代码解释。',
    href: 'https://github.com',
    copyText: '我在 Windows 本地使用 Ollama，请给我一份从安装到编辑器接入的完整流程。',
    status: 'active',
    priority: 'high',
    tags: ['ollama', '编辑器', 'vibe-coding']
  },
  {
    id: 'coding-prompts',
    title: 'Vibe Coding 提示词模板',
    category: '提示词库',
    summary: '放常用的生成页面、改样式、修复报错、重构结构、补文档等提示词。',
    href: '#',
    copyText: '你现在是资深前端工程师，请基于纯静态站技术栈，生成一个 AI 学习资源导航页，包含搜索、分类、收藏、本地缓存和广告位预留。',
    status: 'active',
    priority: 'high',
    tags: ['prompt', '前端', '模板']
  }
];

const storageKeys = {
  favorites: 'ai-learning-resource-favorites',
  theme: 'ai-learning-resource-theme'
};

const priorityRank = {
  high: 0,
  medium: 1,
  review: 2,
  active: 2,
  low: 3
};

const sortLabels = {
  priority: '优先推荐',
  category: '按分类',
  title: '按标题'
};

const state = {
  query: '',
  category: '全部',
  onlyFavorites: false,
  sort: 'priority',
  favorites: loadFavorites(),
  theme: loadTheme(),
  dataSource: '内置备用数据',
  aiDaily: null
};

const ui = {
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  categoryNav: document.getElementById('categoryNav'),
  resourceGrid: document.getElementById('resource-grid'),
  resultMeta: document.getElementById('resultMeta'),
  favoriteToggle: document.getElementById('favoriteToggle'),
  themeToggle: document.getElementById('themeToggle'),
  clearFilters: document.getElementById('clearFilters'),
  resourceTotal: document.getElementById('resourceTotal'),
  categoryTotal: document.getElementById('categoryTotal'),
  dataSourceStatus: document.getElementById('dataSourceStatus'),
  dataNotice: document.getElementById('dataNotice'),
  dailySummary: document.getElementById('dailySummary'),
  dailyList: document.getElementById('dailyList')
};

bootstrap();

async function bootstrap() {
  try {
    if (window.loadSiteData) {
      const siteData = await window.loadSiteData();
      const activeResources = siteData.resources.filter((item) => !item.status || item.status === 'active');
      if (activeResources.length) {
        resources = activeResources;
        state.dataSource = '站点数据文件';
        ui.dataNotice.textContent = `资源来自 site/data/resources.json，已过滤非 active 候选项，当前公开 ${resources.length} 条。`;
      }
    }
  } catch (error) {
    console.warn('Using embedded resource fallback.', error);
    state.dataSource = '内置备用数据';
    ui.dataNotice.textContent = '未读取到 JSON 数据文件，当前展示内置备用资源。请检查 Cloudflare 输出目录。';
  }

  try {
    if (window.loadAiDailyData) {
      state.aiDaily = await window.loadAiDailyData();
    }
  } catch (error) {
    console.warn('AI daily data unavailable.', error);
    state.aiDaily = null;
  }

  init();
}

function init() {
  applyTheme();
  syncControlState();
  renderStats();
  renderAiDaily();
  renderCategories();
  renderResources();
  bindEvents();
}

function loadFavorites() {
  try {
    const raw = window.localStorage.getItem(storageKeys.favorites);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item) : [];
  } catch {
    return [];
  }
}

function loadTheme() {
  return window.localStorage.getItem(storageKeys.theme) === 'dark' ? 'dark' : 'light';
}

function saveFavorites() {
  window.localStorage.setItem(storageKeys.favorites, JSON.stringify(state.favorites));
}

function saveTheme() {
  window.localStorage.setItem(storageKeys.theme, state.theme);
}

function bindEvents() {
  ui.searchInput.addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    renderResources();
    syncControlState();
  });

  ui.sortSelect.addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderResources();
    syncControlState();
  });

  ui.favoriteToggle.addEventListener('click', () => {
    state.onlyFavorites = !state.onlyFavorites;
    renderResources();
    syncControlState();
  });

  ui.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveTheme();
    syncControlState();
  });

  ui.clearFilters.addEventListener('click', resetFilters);

  ui.categoryNav.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    renderCategories();
    renderResources();
    syncControlState();
  });

  ui.resourceGrid.addEventListener('click', async (event) => {
    const resetButton = event.target.closest('button[data-reset-filters]');
    if (resetButton) {
      resetFilters();
      return;
    }

    const copyButton = event.target.closest('button[data-copy]');
    if (copyButton) {
      await copyText(copyButton.dataset.copy);
      const defaultLabel = copyButton.dataset.defaultLabel || defaultCopyLabel;
      copyButton.textContent = '已复制';
      window.setTimeout(() => {
        if (copyButton.isConnected) {
          copyButton.textContent = defaultLabel;
        }
      }, 1200);
      return;
    }

    const favoriteButton = event.target.closest('button[data-favorite]');
    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.favorite);
    }
  });
}

function syncControlState() {
  ui.favoriteToggle.classList.toggle('is-active', state.onlyFavorites);
  ui.favoriteToggle.textContent = state.onlyFavorites ? '显示全部' : '只看收藏';
  ui.favoriteToggle.setAttribute('aria-pressed', String(state.onlyFavorites));

  ui.themeToggle.textContent = state.theme === 'light' ? '深色模式' : '浅色模式';
  ui.themeToggle.setAttribute('aria-pressed', String(state.theme === 'dark'));

  ui.clearFilters.disabled = isDefaultFilterState();
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
}

function renderStats() {
  const categories = new Set(resources.map((item) => item.category).filter(Boolean));
  ui.resourceTotal.textContent = String(resources.length);
  ui.categoryTotal.textContent = String(categories.size);
  ui.dataSourceStatus.textContent = state.dataSource;
}

function renderAiDaily() {
  if (!ui.dailySummary || !ui.dailyList) return;
  const daily = state.aiDaily;
  if (!daily) {
    ui.dailySummary.textContent = '尚未生成 AI 日报。运行 npm.cmd run agent:ai-daily 后会显示。';
    ui.dailyList.innerHTML = '<li class="daily-item"><span class="daily-title">等待本地日报数据。</span><span class="daily-meta">暂无可展示条目</span></li>';
    return;
  }

  const selected = Array.isArray(daily.selected) ? daily.selected : [];
  ui.dailySummary.textContent = daily.summary || `今日入选 ${selected.length} 条内容。`;
  if (!selected.length) {
    ui.dailyList.innerHTML = '<li class="daily-item"><span class="daily-title">今天没有达到过滤阈值的内容。</span><span class="daily-meta">可稍后再次运行日报脚本。</span></li>';
    return;
  }

  ui.dailyList.innerHTML = selected.slice(0, 5).map((item) => {
    const title = escapeHtml(item.title || '未命名内容');
    const href = resolveHref(item.href);
    const source = item.source_name || item.category || '未知来源';
    const date = formatCompactDate(item.published_at || item.discovered_at);
    const score = Number(item.daily_score);
    const scoreLabel = Number.isFinite(score) ? `评分 ${score}` : '';
    const meta = [source, date, scoreLabel].filter(Boolean).join(' · ');
    const titleMarkup = href
      ? `<a class="daily-title" href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${title}</a>`
      : `<span class="daily-title">${title}</span>`;
    return `<li class="daily-item">${titleMarkup}${meta ? `<span class="daily-meta">${escapeHtml(meta)}</span>` : ''}</li>`;
  }).join('');
}

function renderCategories() {
  const categories = ['全部', ...new Set(resources.map((item) => item.category).filter(Boolean))];
  ui.categoryNav.innerHTML = categories
    .map((category) => {
      const count = category === '全部' ? resources.length : resources.filter((item) => item.category === category).length;
      const isActive = category === state.category;
      const activeClass = isActive ? 'pill-button is-active' : 'pill-button';
      return `<button class="${activeClass}" type="button" data-category="${escapeAttribute(category)}" aria-pressed="${String(isActive)}"><span>${escapeHtml(category)}</span><span class="count-badge">${count}</span></button>`;
    })
    .join('');
}

function renderResources() {
  const filtered = sortResources(filterResources());
  const favoriteCount = state.favorites.length;
  const details = buildFilterSummary();
  ui.resultMeta.textContent = details.length
    ? `当前显示 ${filtered.length} 条资源，已收藏 ${favoriteCount} 条 · ${details.join(' · ')}`
    : `当前显示 ${filtered.length} 条资源，已收藏 ${favoriteCount} 条`;

  if (!filtered.length) {
    ui.resourceGrid.innerHTML = '<div class="empty-state"><p>没有找到符合条件的资源，换个关键词或分类试试。</p><button class="pill-button" type="button" data-reset-filters>重置筛选</button></div>';
    return;
  }

  ui.resourceGrid.innerHTML = filtered.map(renderResourceCard).join('');
}

function renderResourceCard(item) {
  const isFavorite = state.favorites.includes(item.id);
  const favoriteText = isFavorite ? '已收藏' : '收藏';
  const favoriteClass = isFavorite ? 'favorite-button is-active' : 'favorite-button';
  const href = resolveHref(item.href);
  const tags = Array.isArray(item.tags) ? item.tags.slice(0, 4) : [];
  const priority = priorityLabel(item.priority);
  const source = item.discovered_by ? '自动发现' : '人工精选';
  const copyValue = String(item.copyText || '').trim();

  return `
    <article class="resource-card">
      <div class="resource-top">
        <span class="tag">${escapeHtml(item.category || '未分类')}</span>
        <button class="${favoriteClass}" type="button" data-favorite="${escapeAttribute(item.id || '')}" aria-pressed="${String(isFavorite)}">${favoriteText}</button>
      </div>
      <div>
        <h3>${escapeHtml(item.title || '未命名资源')}</h3>
        <p>${escapeHtml(item.summary || '暂无摘要。')}</p>
      </div>
      <div class="resource-meta">
        <span>${escapeHtml(priority)}</span>
        <span>${escapeHtml(source)}</span>
        ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="resource-actions">
        ${href ? `<a class="card-link" href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">打开链接</a>` : '<span class="card-link is-disabled" aria-disabled="true">暂无链接</span>'}
        <button class="copy-button" type="button" data-copy="${escapeAttribute(copyValue)}" data-default-label="${defaultCopyLabel}" ${copyValue ? '' : 'disabled'}>${copyValue ? defaultCopyLabel : '暂无提示词'}</button>
      </div>
    </article>
  `;
}

function filterResources() {
  const query = state.query.toLowerCase();
  return resources.filter((item) => {
    const matchCategory = state.category === '全部' || item.category === state.category;
    const matchFavorite = !state.onlyFavorites || state.favorites.includes(item.id);
    const content = [item.title, item.category, item.summary, item.copyText, ...(item.tags || [])].filter(Boolean).join(' ').toLowerCase();
    const matchQuery = !query || content.includes(query);
    return matchCategory && matchFavorite && matchQuery;
  });
}

function sortResources(items) {
  return [...items].sort((a, b) => {
    if (state.sort === 'title') {
      return String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN');
    }
    if (state.sort === 'category') {
      return String(a.category || '').localeCompare(String(b.category || ''), 'zh-CN') || String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN');
    }
    return (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4) || String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN');
  });
}

function priorityLabel(priority) {
  if (priority === 'high') return '优先学习';
  if (priority === 'medium') return '进阶补充';
  if (priority === 'review') return '待复核';
  return '普通资源';
}

function toggleFavorite(id) {
  if (!id) return;
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter((item) => item !== id);
  } else {
    state.favorites = [...state.favorites, id];
  }
  saveFavorites();
  renderResources();
}

function resetFilters() {
  state.query = '';
  state.category = '全部';
  state.onlyFavorites = false;
  state.sort = 'priority';
  ui.searchInput.value = '';
  ui.sortSelect.value = 'priority';
  renderCategories();
  renderResources();
  syncControlState();
}

function isDefaultFilterState() {
  return state.query === '' && state.category === '全部' && !state.onlyFavorites && state.sort === 'priority';
}

function buildFilterSummary() {
  const details = [];
  if (state.query) details.push(`搜索“${state.query}”`);
  if (state.category !== '全部') details.push(`分类 ${state.category}`);
  if (state.onlyFavorites) details.push('仅收藏');
  if (state.sort !== 'priority') details.push(sortLabels[state.sort] || state.sort);
  return details;
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
}

function resolveHref(href) {
  const value = String(href || '').trim();
  if (!value || value === '#' || value.toLowerCase().startsWith('javascript:')) return null;
  return value;
}

function formatCompactDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return compactDateFormatter.format(date);
}

function escapeHtml(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function escapeAttribute(text) {
  return escapeHtml(text);
}
