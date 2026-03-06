import { S } from './state.js';
import { $ } from './utils.js';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  deals: 'Deals',
  contacts: 'Contacts',
  activities: 'Activities',
  reports: 'Reports',
  settings: 'Settings',
};

const pageRenderers = {};

export function registerPage(name, renderer) {
  pageRenderers[name] = renderer;
}

export function navigate(page) {
  S.page = page;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('topbar-title').textContent = PAGE_TITLES[page] || page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = $('page-' + page);
  if (el) el.classList.add('active');
  renderPage(page);
}

export function renderPage(page) {
  const renderer = pageRenderers[page || S.page];
  if (renderer) renderer();
}
