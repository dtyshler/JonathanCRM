import { S } from './state.js';
import { initSupabase } from './supabase.js';
import { $, initials } from './utils.js';
import { navigate, renderPage, registerPage } from './router.js';
import { loadAllData, updateNavCounts } from './data.js';
import { handleSignIn, handleSignUp, handleSignOut, toggleAuth } from './auth.js';
import { setupRealtime } from './realtime.js';

import { renderDashboard } from './dashboard.js';
import { renderDeals, setDealsView, sortDeals, openDealModal, closeDealModal, saveDeal, deleteDeal } from './deals.js';
import { renderContacts, openContactModal, closeContactModal, saveContact, deleteContact } from './contacts.js';
import { renderActivities, setActivityFilter, toggleActivity, openActivityModal, closeActivityModal, saveActivity, deleteActivity } from './activities.js';
import { renderReports } from './reports.js';
import { renderSettings, saveSettings, exportDeals } from './settings.js';
import { openCmdPalette, closeCmdPalette, filterCmdResults } from './cmd-palette.js';

// ── Register page renderers ────────────────────────────────

registerPage('dashboard', renderDashboard);
registerPage('deals', renderDeals);
registerPage('contacts', renderContacts);
registerPage('activities', renderActivities);
registerPage('reports', renderReports);
registerPage('settings', renderSettings);

// ── Expose to window for inline HTML handlers ──────────────

Object.assign(window, {
  navigate,
  handleSignIn, handleSignUp, handleSignOut, toggleAuth,
  openDealModal, closeDealModal, saveDeal, deleteDeal, setDealsView, sortDeals,
  openContactModal, closeContactModal, saveContact, deleteContact,
  openActivityModal, closeActivityModal, saveActivity, deleteActivity, setActivityFilter, toggleActivity,
  saveSettings, exportDeals,
  openCmdPalette, closeCmdPalette, filterCmdResults,
  renderDeals, renderContacts, renderActivities,
});

// ── Data-changed event (decoupled re-render) ───────────────

document.addEventListener('data-changed', () => {
  updateNavCounts();
  renderPage(S.page);
});

// ── Keyboard shortcuts ─────────────────────────────────────

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openCmdPalette(); return; }
  if (e.key === 'Escape') {
    if ($('cmd-palette').classList.contains('open')) { closeCmdPalette(); return; }
    closeDealModal(); closeContactModal(); closeActivityModal();
  }
});

// ── Bootstrap ──────────────────────────────────────────────

function init() {
  const client = initSupabase();

  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      S.user = session.user;
      showApp();
    } else {
      S.user = null;
      $('auth-screen').style.display = 'flex';
      $('app').classList.remove('visible');
    }
  });
}

async function showApp() {
  $('auth-screen').style.display = 'none';
  $('app').classList.add('visible');
  const name = S.user.user_metadata?.full_name || S.user.email || 'User';
  $('sidebar-avatar').textContent = initials(name);
  $('sidebar-name').textContent = name;
  $('sidebar-email').textContent = S.user.email || '';
  await loadAllData();
  setupRealtime();
  renderPage(S.page);
}

init();
