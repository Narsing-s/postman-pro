const COLLECTIONS_KEY = 'postman-pro.collections';
const REQUESTS_KEY = 'postman-pro.requests';

const moreItems = [
  ['Create mock server', 'mock'],
  ['Create monitor', 'monitor'],
  ['Create flow', 'flow'],
  ['Generate tests', 'tests'],
  ['Generate specification', 'specification'],
  ['Export collection', 'export']
] as const;

function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

function notify(message: string) {
  const existing = document.querySelector('.toast');
  if (existing) existing.textContent = message;
  else {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 1800);
  }
}

function exportCollection(menu: HTMLElement) {
  const block = menu.closest('.collection-block');
  const name = block?.querySelector('.collection-name')?.textContent?.trim() || 'collection';
  const collections = readJson<any[]>(COLLECTIONS_KEY, []);
  const requests = readJson<any[]>(REQUESTS_KEY, []);
  const collection = collections.find(c => c.name === name);
  if (!collection) return notify('Collection data not found');
  const items = requests.filter(r => collection.requestIds?.includes(r.id)).map(r => ({
    name: r.name,
    request: {
      method: r.method,
      url: r.url,
      header: r.headers || [],
      body: r.bodyType === 'none' ? undefined : { mode: r.bodyType, raw: r.body }
    }
  }));
  const data = {
    info: { name: collection.name, schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    item: items
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${collection.name.replace(/[^a-z0-9-_]+/gi, '_')}.postman_collection.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  notify('Collection exported');
}

function runSort(menu: HTMLElement, direction: 'az' | 'za') {
  const block = menu.closest('.collection-block');
  const name = block?.querySelector('.collection-name')?.textContent?.trim();
  const collections = readJson<any[]>(COLLECTIONS_KEY, []);
  const requests = readJson<any[]>(REQUESTS_KEY, []);
  const collection = collections.find(x => x.name === name);
  if (!collection) return;
  const sorted = requests
    .filter(r => collection.requestIds?.includes(r.id))
    .sort((a, b) => a.name.localeCompare(b.name) * (direction === 'az' ? 1 : -1));
  collection.requestIds = sorted.map(r => r.id);
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  notify(direction === 'az' ? 'Requests sorted A–Z' : 'Requests sorted Z–A');
  window.location.reload();
}

function makeSubmenu(items: readonly string[][], className: string) {
  const submenu = document.createElement('div');
  submenu.className = `context-submenu ${className}`;
  items.forEach(([label, action]) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.innerHTML = `<span>${label}</span>`;
    item.dataset.action = action;
    submenu.appendChild(item);
  });
  return submenu;
}

function enhanceMenu(menu: HTMLElement) {
  if (menu.dataset.enhanced === 'true') return;
  menu.dataset.enhanced = 'true';

  const sort = Array.from(menu.querySelectorAll('button')).find(b => b.textContent?.includes('Sort A–Z')) as HTMLButtonElement | undefined;
  if (sort) {
    const wrap = document.createElement('div');
    wrap.className = 'context-submenu-wrap';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'submenu-trigger';
    button.innerHTML = '<span>Sort</span><span class="submenu-arrow">›</span>';
    button.addEventListener('click', e => e.stopPropagation());
    wrap.appendChild(button);
    const submenu = makeSubmenu([['A–Z', 'az'], ['Z–A', 'za']], 'sort-submenu');
    submenu.querySelector('[data-action="az"]')?.addEventListener('click', e => { e.stopPropagation(); runSort(menu, 'az'); });
    submenu.querySelector('[data-action="za"]')?.addEventListener('click', e => { e.stopPropagation(); runSort(menu, 'za'); });
    wrap.appendChild(submenu);
    sort.replaceWith(wrap);
  }

  const moreWrap = document.createElement('div');
  moreWrap.className = 'context-submenu-wrap more-wrap';
  const moreButton = document.createElement('button');
  moreButton.type = 'button';
  moreButton.className = 'submenu-trigger';
  moreButton.innerHTML = '<span>More</span><span class="submenu-arrow">›</span>';
  moreButton.addEventListener('click', e => e.stopPropagation());
  moreWrap.appendChild(moreButton);
  const submenu = makeSubmenu(moreItems, 'more-submenu');
  submenu.querySelectorAll('button').forEach(button => button.addEventListener('click', e => {
    e.stopPropagation();
    const action = (button as HTMLElement).dataset.action;
    if (action === 'export') return exportCollection(menu);
    notify(`${button.textContent || ''} selected`);
  }));
  moreWrap.appendChild(submenu);
  menu.appendChild(moreWrap);
}

const observer = new MutationObserver(() => {
  document.querySelectorAll<HTMLElement>('.collection-menu').forEach(enhanceMenu);
});
observer.observe(document.body, { childList: true, subtree: true });
document.querySelectorAll<HTMLElement>('.collection-menu').forEach(enhanceMenu);
