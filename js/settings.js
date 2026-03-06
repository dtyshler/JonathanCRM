import { S } from './state.js';
import { sb } from './supabase.js';
import { $, esc, fmtDate, initials, toast } from './utils.js';

export function renderSettings() {
  const body = $('settings-body');
  const name = S.user.user_metadata?.full_name || '';
  const email = S.user.email || '';

  body.innerHTML = `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:20px;font-weight:800;letter-spacing:-0.03em;">Settings</h2>
      <p class="text-muted" style="margin-top:4px;">Manage your profile and preferences.</p>
    </div>
    <div class="settings-section">
      <div class="settings-title">Profile</div>
      <div class="settings-desc">Your account information.</div>
      <div class="settings-row">
        <label>Name</label>
        <input class="form-input" type="text" id="settings-name" value="${esc(name)}" placeholder="Full name">
      </div>
      <div class="settings-row">
        <label>Email</label>
        <input class="form-input" type="email" value="${esc(email)}" disabled style="opacity:0.6;cursor:not-allowed;">
      </div>
      <div style="margin-top:16px;">
        <button class="btn btn-primary" onclick="saveSettings()">Save Profile</button>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-title">Data</div>
      <div class="settings-desc">Manage your CRM data.</div>
      <div style="display:flex;gap:8px;">
        <button class="btn" onclick="exportDeals()">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Export Deals CSV
        </button>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-title" style="color:var(--red);">Danger Zone</div>
      <div class="settings-desc">Irreversible actions.</div>
      <button class="btn btn-danger" onclick="handleSignOut()">Sign Out</button>
    </div>`;
}

export async function saveSettings() {
  const name = $('settings-name').value.trim();
  const { error } = await sb.auth.updateUser({ data: { full_name: name } });
  if (error) { toast('Error: ' + error.message); return; }
  S.user.user_metadata = { ...S.user.user_metadata, full_name: name };
  $('sidebar-name').textContent = name;
  $('sidebar-avatar').textContent = initials(name);
  toast('Profile saved.');
}

export function exportDeals() {
  const headers = ['Title', 'Organization', 'Contact', 'Value', 'Currency', 'Stage', 'Label', 'Expected Close', 'Created'];
  const rows = S.deals.map(d => [d.title, d.organization, d.contact_person, d.value, d.currency, d.stage, d.label, d.expected_close, d.created_at].map(v => '"' + (v || '').toString().replace(/"/g, '""') + '"'));
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'deals-export.csv';
  a.click();
  toast('Deals exported.');
}
