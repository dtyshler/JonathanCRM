import { AVATAR_COLORS } from './config.js';

export const $ = id => document.getElementById(id);

export const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function fmtVal(v, currency = 'USD') {
  if (!v) return '$0';
  const sym = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$' }[currency] || '$';
  return sym + Number(v).toLocaleString();
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtRelative(d) {
  if (!d) return '';
  const now = new Date(), then = new Date(d);
  const diff = now - then;
  const mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  if (hrs < 24) return hrs + 'h ago';
  if (days < 7) return days + 'd ago';
  return fmtDate(d);
}

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function sortList(arr, field, dir) {
  return [...arr].sort((a, b) => {
    let va = a[field], vb = b[field];
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (typeof va === 'number') return dir === 'asc' ? va - vb : vb - va;
    return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

let toastTimer;
export function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

export function renderEmpty(title, desc, action, btnText) {
  return `<div class="empty-state">
    <div class="empty-state-icon">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
    </div>
    <h3>${title}</h3>
    <p>${desc}</p>
    ${action ? `<button class="btn btn-primary" onclick="${action}">${btnText}</button>` : ''}
  </div>`;
}

export function emitDataChanged() {
  document.dispatchEvent(new CustomEvent('data-changed'));
}
