async function loadJsonResource(url, arrayKey) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(`${url} returned non-JSON content. Check Cloudflare output directory.`);
  }

  const data = await response.json();
  if (!Array.isArray(data[arrayKey])) {
    throw new Error(`${url} has no ${arrayKey} array.`);
  }

  return data;
}

async function loadSiteData() {
  return loadJsonResource('./data/resources.json', 'resources');
}

async function loadAiDailyData() {
  return loadJsonResource('./data/ai-daily.json', 'selected');
}

window.loadSiteData = loadSiteData;
window.loadAiDailyData = loadAiDailyData;
