import { S } from './state.js';
import { STAGES, STAGE_COLORS } from './config.js';
import { $, esc, fmtVal, fmtDate, fmtRelative, greeting } from './utils.js';

export function renderDashboard() {
  const body = $('dashboard-body');
  const pipelineValue = S.deals.reduce((s, d) => s + (d.value || 0), 0);
  const activeDealCount = S.deals.length;
  const dueActivities = S.activities.filter(a => !a.completed && a.due_date && new Date(a.due_date) <= new Date(Date.now() + 86400000)).length;
  const contactCount = S.contacts.length;
  const name = (S.user.user_metadata?.full_name || S.user.email || 'there').split(' ')[0];

  const maxStageCount = Math.max(...STAGES.map(st => S.deals.filter(d => d.stage === st).length), 1);

  const funnelHtml = STAGES.map((st, i) => {
    const deals = S.deals.filter(d => d.stage === st);
    const val = deals.reduce((s, d) => s + (d.value || 0), 0);
    const pct = (deals.length / maxStageCount * 100);
    return `<div class="funnel-row">
      <span class="funnel-label">${esc(st)}</span>
      <div class="funnel-bar-wrap"><div class="funnel-bar" style="width:${pct}%;background:${STAGE_COLORS[i]}"></div></div>
      <span class="funnel-value">${deals.length} · ${fmtVal(val)}</span>
    </div>`;
  }).join('');

  const recentActivities = [...S.activities].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
  const recentDeals = [...S.deals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  let feedHtml = '';
  if (recentActivities.length > 0) {
    feedHtml = recentActivities.map(a => {
      const typeClass = 'type-' + (a.type || 'task');
      const typeIcon = { task: '✓', call: '📞', email: '✉', meeting: '📅' }[a.type || 'task'] || '✓';
      return `<div class="activity-feed-item">
        <div class="feed-icon ${typeClass}">${typeIcon}</div>
        <div class="feed-body">
          <div class="feed-title">${esc(a.title)}</div>
          <div class="feed-meta">${a.due_date ? fmtDate(a.due_date) : ''} ${a.completed ? '· Done' : ''}</div>
        </div>
      </div>`;
    }).join('');
  } else {
    feedHtml = recentDeals.map(d => `<div class="activity-feed-item">
      <div class="feed-icon" style="background:var(--accent-dim);color:var(--accent);">◆</div>
      <div class="feed-body">
        <div class="feed-title">${esc(d.title)}</div>
        <div class="feed-meta">${esc(d.stage)} · ${fmtRelative(d.created_at)}</div>
      </div>
    </div>`).join('');
  }

  body.innerHTML = `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.03em;">${greeting()}, ${esc(name)}</h2>
      <p class="text-muted" style="margin-top:4px;">Here's what's happening with your pipeline.</p>
    </div>
    <div class="dash-stats">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="stat-value">${fmtVal(pipelineValue)}</div>
        <div class="stat-label">Pipeline Value</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div class="stat-value">${activeDealCount}</div>
        <div class="stat-label">Active Deals</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-amber">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <div class="stat-value">${dueActivities}</div>
        <div class="stat-label">Activities Due</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="stat-value">${contactCount}</div>
        <div class="stat-label">Contacts</div>
      </div>
    </div>
    <div class="dash-grid">
      <div class="dash-card">
        <div class="dash-card-title">Pipeline Funnel</div>
        ${funnelHtml}
      </div>
      <div class="dash-card">
        <div class="dash-card-title">Recent Activity</div>
        ${feedHtml || '<div class="empty-state" style="padding:20px;"><p>No recent activity</p></div>'}
      </div>
    </div>`;
}
