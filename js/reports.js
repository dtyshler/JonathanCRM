import { S } from './state.js';
import { STAGES, STAGE_COLORS } from './config.js';
import { $, esc, fmtVal } from './utils.js';

export function renderReports() {
  const body = $('reports-body');
  const totalPipeline = S.deals.reduce((s, d) => s + (d.value || 0), 0);
  const totalDeals = S.deals.length;
  const completedActivities = S.activities.filter(a => a.completed).length;
  const totalActivities = S.activities.length;
  const avgDealValue = totalDeals > 0 ? Math.round(totalPipeline / totalDeals) : 0;

  const maxVal = Math.max(...STAGES.map(st => S.deals.filter(d => d.stage === st).reduce((s, d) => s + (d.value || 0), 0)), 1);

  const pipelineChart = STAGES.map((st, i) => {
    const deals = S.deals.filter(d => d.stage === st);
    const val = deals.reduce((s, d) => s + (d.value || 0), 0);
    const pct = (val / maxVal * 100);
    return `<div class="report-bar-row">
      <span class="report-bar-label">${esc(st)}</span>
      <div class="report-bar-track"><div class="report-bar-fill" style="width:${pct}%;background:${STAGE_COLORS[i]}"></div></div>
      <span class="report-bar-val">${fmtVal(val)}</span>
    </div>`;
  }).join('');

  const maxCount = Math.max(...STAGES.map(st => S.deals.filter(d => d.stage === st).length), 1);
  const countChart = STAGES.map((st, i) => {
    const count = S.deals.filter(d => d.stage === st).length;
    const pct = (count / maxCount * 100);
    return `<div class="report-bar-row">
      <span class="report-bar-label">${esc(st)}</span>
      <div class="report-bar-track"><div class="report-bar-fill" style="width:${pct}%;background:${STAGE_COLORS[i]}"></div></div>
      <span class="report-bar-val">${count}</span>
    </div>`;
  }).join('');

  body.innerHTML = `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:20px;font-weight:800;letter-spacing:-0.03em;">Reports</h2>
      <p class="text-muted" style="margin-top:4px;">Pipeline analytics and key metrics.</p>
    </div>
    <div class="dash-stats" style="margin-bottom:24px;">
      <div class="stat-card">
        <div class="stat-value">${fmtVal(totalPipeline)}</div>
        <div class="stat-label">Total Pipeline</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalDeals}</div>
        <div class="stat-label">Total Deals</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${fmtVal(avgDealValue)}</div>
        <div class="stat-label">Avg Deal Value</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalActivities > 0 ? Math.round(completedActivities / totalActivities * 100) : 0}%</div>
        <div class="stat-label">Activity Completion</div>
      </div>
    </div>
    <div class="report-grid">
      <div class="report-card">
        <div class="report-card-title">Pipeline Value by Stage</div>
        ${pipelineChart}
      </div>
      <div class="report-card">
        <div class="report-card-title">Deal Count by Stage</div>
        ${countChart}
      </div>
    </div>`;
}
