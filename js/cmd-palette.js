import { S } from './state.js';
import { $, esc } from './utils.js';
import { navigate } from './router.js';

export function openCmdPalette() {
  $('cmd-palette').classList.add('open');
  $('cmd-input').value = '';
  filterCmdResults();
  setTimeout(() => $('cmd-input').focus(), 50);
}

export function closeCmdPalette() {
  $('cmd-palette').classList.remove('open');
}

export function filterCmdResults() {
  const q = ($('cmd-input').value || '').toLowerCase().trim();
  const results = $('cmd-results');
  const items = [];

  const pages = [
    { label: 'Dashboard', page: 'dashboard', icon: '📊' },
    { label: 'Deals', page: 'deals', icon: '◆' },
    { label: 'Contacts', page: 'contacts', icon: '👤' },
    { label: 'Activities', page: 'activities', icon: '📅' },
    { label: 'Reports', page: 'reports', icon: '📈' },
    { label: 'Settings', page: 'settings', icon: '⚙' },
  ];

  const actions = [
    { label: 'New Deal', action: 'openDealModal()', icon: '+', hint: 'Create' },
    { label: 'New Contact', action: 'openContactModal()', icon: '+', hint: 'Create' },
    { label: 'New Activity', action: 'openActivityModal()', icon: '+', hint: 'Create' },
  ];

  pages.forEach(p => {
    if (!q || p.label.toLowerCase().includes(q)) {
      items.push({ html: `<div class="cmd-item" onclick="navigate('${p.page}');closeCmdPalette()">
        <div class="cmd-item-icon">${p.icon}</div>
        <span class="cmd-item-label">${p.label}</span>
        <span class="cmd-item-hint">Go to</span>
      </div>` });
    }
  });

  actions.forEach(a => {
    if (!q || a.label.toLowerCase().includes(q)) {
      items.push({ html: `<div class="cmd-item" onclick="${a.action};closeCmdPalette()">
        <div class="cmd-item-icon" style="color:var(--accent);font-weight:700;">${a.icon}</div>
        <span class="cmd-item-label">${a.label}</span>
        <span class="cmd-item-hint">${a.hint}</span>
      </div>` });
    }
  });

  if (q) {
    S.deals.filter(d => (d.title || '').toLowerCase().includes(q) || (d.organization || '').toLowerCase().includes(q)).slice(0, 5).forEach(d => {
      items.push({ html: `<div class="cmd-item" onclick="navigate('deals');openDealModal('${d.id}');closeCmdPalette()">
        <div class="cmd-item-icon">◆</div>
        <span class="cmd-item-label">${esc(d.title)}</span>
        <span class="cmd-item-hint">Deal</span>
      </div>` });
    });

    S.contacts.filter(c => (c.full_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)).slice(0, 5).forEach(c => {
      items.push({ html: `<div class="cmd-item" onclick="navigate('contacts');openContactModal('${c.id}');closeCmdPalette()">
        <div class="cmd-item-icon">👤</div>
        <span class="cmd-item-label">${esc(c.full_name)}</span>
        <span class="cmd-item-hint">Contact</span>
      </div>` });
    });
  }

  if (items.length === 0) {
    results.innerHTML = '<div class="cmd-empty">No results found</div>';
  } else {
    results.innerHTML = items.map(i => i.html).join('');
  }
}
