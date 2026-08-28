import './collectionMenuEnhancer.css';

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

  const items = requests
    .filter(r => collection.requestIds?.includes(r.id))
    .map(r => ({
      name: r.name,
      request: {
        method: r.method,
        url: r.url,
        header: r.headers || [],
        body: r.bodyType === 'none' ? undefined : { mode: r.bodyType, raw: r.body }
      }
    }));

  const data = {
    info: {
      name: collection.name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
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

function icon(label: string) {
  const value: Record<string, string> = {
    'Add request': '+',
    'Add folder': '□',
    Run: '▶',
    Share: '↗',
    'Copy link': '⧉',
    'Ask AI': '✦',
    Move: '→',
    Fork: '⑂',
    Rename: '✎',
    Duplicate: '▣',
    Sort: '↕',
    Delete: '♲',
    'A–Z': 'A',
    'Z–A': 'Z',
    'Create mock server': '▣',
    'Create monitor': '◉',
    'Create flow': '⌁',
    'Generate tests': '✓',
    'Generate specification': '≡',
    'Export collection': '⇩'
  };
  return `<span class="context-icon">${value[label] || '•'}</span>`;
}

function makeButton(label: string, handler?: () => void, danger = false) {
  const button = document.createElement('button');
  button.type = 'button';
  if (danger) button.className = 'danger';
  button.innerHTML = `${icon(label)}<span>${label}</span>`;
  if (handler) button.addEventListener('click', e => {
    e.stopPropagation();
    handler();
  });
  return button;
}

function makeSubmenu(items: readonly string[][], className: string) {
  const submenu = document.createElement('div');
  submenu.className = `context-submenu ${className}`;
  items.forEach(([label, action]) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.innerHTML = `${icon(label)}<span>${label}</span>`;
    item.dataset.action = action;
    submenu.appendChild(item);
  });
  return submenu;
}

function enhanceMenu(menu: HTMLElement) {
  if (menu.dataset.enhanced === 'true') return;
  menu.dataset.enhanced = 'true';

  const original = Array.from(menu.querySelectorAll(':scope > button')) as HTMLButtonElement[];
  const findOriginal = (text: string) => original.find(b => (b.textContent || '').includes(text));
  const trigger = (text: string, fallback?: () => void) => {
    const button = findOriginal(text);
    if (button) button.click();
    else fallback?.();
  };

  const collectionBlock = menu.closest('.collection-block');
  const collectionName = collectionBlock?.querySelector('.collection-name')?.textContent?.trim() || 'collection';

  menu.innerHTML = '';

  // Keep React's original action buttons mounted so their existing handlers continue to work.
  const proxies = document.createElement('div');
  proxies.className = 'context-action-proxies';
  original.forEach(button => proxies.appendChild(button));
  menu.appendChild(proxies);

  menu.appendChild(makeButton('Add request', () => trigger('Add request')));
  menu.appendChild(makeButton('Add folder', () => trigger('Add folder')));

  const divider1 = document.createElement('div');
  divider1.className = 'context-divider';
  menu.appendChild(divider1);

  menu.appendChild(makeButton('Run', () => notify(`Run ${collectionName}`)));
  menu.appendChild(makeButton('Share', () => notify('Share collection selected')));
  menu.appendChild(makeButton('Copy link', () => {
    navigator.clipboard?.writeText(collectionName).catch(() => undefined);
    notify('Collection link copied');
  }));
  menu.appendChild(makeButton('Ask AI', () => notify('Ask AI selected')));
  menu.appendChild(makeButton('Move', () => notify('Move collection selected')));
  menu.appendChild(makeButton('Fork', () => notify('Fork collection selected')));
  menu.appendChild(makeButton('Rename', () => trigger('Rename')));
  menu.appendChild(makeButton('Duplicate', () => notify('Duplicate collection selected')));

  const sortWrap = document.createElement('div');
  sortWrap.className = 'context-submenu-wrap';
  const sortButton = makeButton('Sort');
  sortButton.classList.add('submenu-trigger');
  sortButton.innerHTML += '<span class="submenu-arrow">›</span>';
  sortWrap.appendChild(sortButton);
  const sortSubmenu = makeSubmenu([['A–Z', 'az'], ['Z–A', 'za']], 'sort-submenu');
  sortSubmenu.querySelector('[data-action="az"]')?.addEventListener('click', e => {
    e.stopPropagation();
    runSort(menu, 'az');
  });
  sortSubmenu.querySelector('[data-action="za"]')?.addEventListener('click', e => {
    e.stopPropagation();
    runSort(menu, 'za');
  });
  sortWrap.appendChild(sortSubmenu);
  menu.appendChild(sortWrap);

  menu.appendChild(makeButton('Delete', () => trigger('Delete collection'), true));

  const divider2 = document.createElement('div');
  divider2.className = 'context-divider';
  menu.appendChild(divider2);

  const moreWrap = document.createElement('div');
  moreWrap.className = 'context-submenu-wrap more-wrap';
  const moreButton = makeButton('More');
  moreButton.classList.add('submenu-trigger');
  moreButton.innerHTML += '<span class="submenu-arrow">›</span>';
  moreWrap.appendChild(moreButton);

  const moreSubmenu = makeSubmenu(moreItems, 'more-submenu');
  moreSubmenu.querySelectorAll('button').forEach(button => button.addEventListener('click', e => {
    e.stopPropagation();
    const action = (button as HTMLElement).dataset.action;
    if (action === 'export') return exportCollection(menu);
    notify(`${button.textContent || ''} selected`);
  }));
  moreWrap.appendChild(moreSubmenu);
  menu.appendChild(moreWrap);
}

const observer = new MutationObserver(() => {
  document.querySelectorAll<HTMLElement>('.collection-menu').forEach(enhanceMenu);
});
observer.observe(document.body, { childList: true, subtree: true });
document.querySelectorAll<HTMLElement>('.collection-menu').forEach(enhanceMenu);
