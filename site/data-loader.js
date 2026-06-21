async function loadSiteData() {
  const response = await fetch('./data/resources.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load resources.json');
  }
  return response.json();
}

window.loadSiteData = loadSiteData;
