let resources = [
  {
    id: 'ollama-windows-fix',
    title: 'Ollama Windows 部署排错',
    category: 'Ollama教程',
    summary: '适合首页首批内容：安装、启动失败、端口占用、模型拉取慢、环境变量等常见问题。',
    href: 'https://ollama.com',
    copyText: 'ollama --version\nollama list\nollama pull qwen2.5:7b'
  },
  {
    id: 'ollama-cursor-link',
    title: 'Ollama 对接 Cursor / VS Code 思路',
    category: 'Ollama教程',
    summary: '整理本地模型如何给编辑器或代码工作流提供补全、问答和代码解释。',
    href: 'https://github.com',
    copyText: '我在 Windows 本地使用 Ollama，请给我一份从安装到编辑器接入的完整流程。'
  },
  {
    id: 'qwen-model-guide',
    title: 'Qwen 系列模型入门',
    category: 'Qwen/DeepSeek代码模型',
    summary: '适合介绍模型定位、参数大小选择、日常问答与代码场景区别。',
    href: 'https://www.modelscope.cn',
    copyText: '请对比 Qwen、DeepSeek、Llama 在本地部署时的资源占用与适用场景。'
  },
  {
    id: 'deepseek-coder-notes',
    title: 'DeepSeek 代码模型整理页',
    category: 'Qwen/DeepSeek代码模型',
    summary: '可汇总写代码、改 Bug、解释报错、重构脚本等常用玩法。',
    href: 'https://huggingface.co',
    copyText: '请帮我写一个适合 DeepSeek 代码模型的 Vibe Coding 提示词模板。'
  },
  {
    id: 'coding-prompts',
    title: 'Vibe Coding 提示词模板',
    category: '提示词库',
    summary: '放常用的生成页面、改样式、修复报错、重构结构、补文档等提示词。',
    href: '#',
    copyText: '你现在是资深前端工程师，请基于纯静态站技术栈，生成一个 AI 学习资源导航页，包含搜索、分类、收藏、本地缓存和广告位预留。'
  },
  {
    id: 'learning-prompts',
    title: '学习提问模板',
    category: '提示词库',
    summary: '给新手准备“我该先学什么”“报错怎么问”“模型怎么选”这类模板。',
    href: '#',
    copyText: '请用大白话告诉我：Windows 本地部署大模型，最低配置、推荐配置和避坑点分别是什么？'
  },
  {
    id: 'image-tutorial',
    title: 'AI 绘图新手路线',
    category: 'AI绘图教程',
    summary: '可收录提示词基础、风格参考、常见参数理解和免费绘图工具入口。',
    href: 'https://www.civitai.com',
    copyText: '请给我一份适合新手的 AI 绘图学习路线，从提示词到风格控制。'
  },
  {
    id: 'free-model-sites',
    title: '免费大模型网站合集',
    category: '免费大模型网站',
    summary: '适合放官方站、模型社区、镜像站、开源工具官网等入口。',
    href: 'https://huggingface.co',
    copyText: '请整理一份可公开访问、适合学习的免费 AI 模型与工具网站列表。'
  },
  {
    id: 'automation-cases',
    title: '自动化脚本案例页',
    category: '自动化脚本案例',
    summary: '适合汇总文件整理、批量重命名、网页抓取、日报生成等脚本案例。',
    href: 'https://github.com',
    copyText: '请给我 10 个适合 AI 新手练手的自动化脚本案例，并标明难度。'
  },
  {
    id: 'cloudflare-pages',
    title: 'Cloudflare Pages 免费部署',
    category: '免费大模型网站',
    summary: '可讲清静态站如何从 GitHub 一键上线，以及后续绑定域名。',
    href: 'https://www.cloudflare.com',
    copyText: '请一步一步教我把纯静态网页部署到 Cloudflare Pages。'
  }
];

const state = {
  query: '',
  category: '全部',
  onlyFavorites: false,
  favorites: loadFavorites(),
  theme: loadTheme()
};

const storageKeys = {
  favorites: 'ai-learning-resource-favorites',
  theme: 'ai-learning-resource-theme'
};

const searchInput = document.getElementById('searchInput');
const categoryNav = document.getElementById('categoryNav');
const resourceGrid = document.getElementById('resource-grid');
const resultMeta = document.getElementById('resultMeta');
const favoriteToggle = document.getElementById('favoriteToggle');
const themeToggle = document.getElementById('themeToggle');

bootstrap();

async function bootstrap() {
  try {
    if (window.loadSiteData) {
      const siteData = await window.loadSiteData();
      if (Array.isArray(siteData.resources) && siteData.resources.length) {
        resources = siteData.resources.filter((item) => !item.status || item.status === 'active');
      }
    }
  } catch (error) {
    console.warn('Using embedded resource fallback.', error);
  }

  init();
}

function init() {
  applyTheme();
  renderCategories();
  renderResources();
  bindEvents();
}

function loadFavorites() {
  try {
    const raw = window.localStorage.getItem('ai-learning-resource-favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadTheme() {
  return window.localStorage.getItem('ai-learning-resource-theme') || 'light';
}

function saveFavorites() {
  window.localStorage.setItem(storageKeys.favorites, JSON.stringify(state.favorites));
}

function saveTheme() {
  window.localStorage.setItem(storageKeys.theme, state.theme);
}

function bindEvents() {
  searchInput.addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    renderResources();
  });

  favoriteToggle.addEventListener('click', () => {
    state.onlyFavorites = !state.onlyFavorites;
    favoriteToggle.classList.toggle('is-active', state.onlyFavorites);
    favoriteToggle.textContent = state.onlyFavorites ? '显示全部' : '只看收藏';
    renderResources();
  });

  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveTheme();
  });

  categoryNav.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) {
      return;
    }

    state.category = button.dataset.category;
    renderCategories();
    renderResources();
  });

  resourceGrid.addEventListener('click', async (event) => {
    const copyButton = event.target.closest('button[data-copy]');
    if (copyButton) {
      await copyText(copyButton.dataset.copy);
      copyButton.textContent = '已复制';
      window.setTimeout(() => {
        copyButton.textContent = '复制模板';
      }, 1200);
      return;
    }

    const favoriteButton = event.target.closest('button[data-favorite]');
    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.favorite);
    }
  });
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  themeToggle.textContent = state.theme === 'light' ? '切到深色' : '切到浅色';
}

function renderCategories() {
  const categories = ['全部', ...new Set(resources.map((item) => item.category))];

  categoryNav.innerHTML = categories
    .map((category) => {
      const activeClass = category === state.category ? 'pill-button is-active' : 'pill-button';
      return `<button class="${activeClass}" type="button" data-category="${category}">${category}</button>`;
    })
    .join('');
}

function renderResources() {
  const filtered = filterResources();

  resultMeta.textContent = `当前显示 ${filtered.length} 条资源`;

  if (!filtered.length) {
    resourceGrid.innerHTML = '<div class="empty-state">没有找到符合条件的资源，换个关键词试试。</div>';
    return;
  }

  resourceGrid.innerHTML = filtered
    .map((item) => {
      const isFavorite = state.favorites.includes(item.id);
      const favoriteText = isFavorite ? '已收藏' : '加入收藏';
      const favoriteClass = isFavorite ? 'favorite-button is-active' : 'favorite-button';
      const safeHref = item.href && item.href !== '#' ? item.href : 'javascript:void(0)';
      const disabledAttr = item.href && item.href !== '#' ? '' : 'aria-disabled="true"';

      return `
        <article class="resource-card">
          <div class="resource-top">
            <span class="tag">${item.category}</span>
            <button class="${favoriteClass}" type="button" data-favorite="${item.id}">${favoriteText}</button>
          </div>
          <div>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
          </div>
          <div class="resource-actions">
            <a class="card-link" href="${safeHref}" target="_blank" rel="noreferrer" ${disabledAttr}>打开链接</a>
            <button class="copy-button" type="button" data-copy="${escapeAttribute(item.copyText)}">复制模板</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function filterResources() {
  const query = state.query.toLowerCase();

  return resources.filter((item) => {
    const matchCategory = state.category === '全部' || item.category === state.category;
    const matchFavorite = !state.onlyFavorites || state.favorites.includes(item.id);
    const content = `${item.title} ${item.category} ${item.summary}`.toLowerCase();
    const matchQuery = !query || content.includes(query);

    return matchCategory && matchFavorite && matchQuery;
  });
}

function toggleFavorite(id) {
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter((item) => item !== id);
  } else {
    state.favorites = [...state.favorites, id];
  }

  saveFavorites();
  renderResources();
}

async function copyText(text) {
  if (!text) {
    return;
  }

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

function escapeAttribute(text) {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
