import { S } from './state.js';
import { sb } from './supabase.js';
import { STAGES, STAGE_COLORS } from './config.js';
import { $, esc, fmtVal, fmtDate, sortList, toast, renderEmpty, emitDataChanged } from './utils.js';

export function getFilteredDeals() {
  let list = [...S.deals];
  const q = ($('deals-search')?.value || '').toLowerCase().trim();
  const stageFilter = $('deals-filter-stage')?.value || '';
  const labelFilter = $('deals-filter-label')?.value || '';

  if (q) list = list.filter(d => (d.title || '').toLowerCase().includes(q) || (d.organization || '').toLowerCase().includes(q) || (d.contact_person || '').toLowerCase().includes(q));
  if (stageFilter) list = list.filter(d => d.stage === stageFilter);
  if (labelFilter) list = list.filter(d => d.label === labelFilter);
  return list;
}

export function renderDeals() {
  populateStageFilter();
  const list = getFilteredDeals();
  $('deals-meta').textContent = list.length + ' deal' + (list.length !== 1 ? 's' : '');

  if (S.dealsView === 'kanban') {
    $('deals-kanban').style.display = 'flex';
    $('deals-list').style.display = 'none';
    renderKanban(list);
  } else {
    $('deals-kanban').style.display = 'none';
    $('deals-list').style.display = '';
    renderDealsList(list);
  }
}

function populateStageFilter() {
  const sel = $('deals-filter-stage');
  if (sel.options.length <= 1) {
    STAGES.forEach(st => { const o = document.createElement('option'); o.value = st; o.textContent = st; sel.appendChild(o); });
  }
}

export function setDealsView(view) {
  S.dealsView = view;
  document.querySelectorAll('#page-deals .vt').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  renderDeals();
}

function renderKanban(list) {
  const board = $('deals-kanban');
  board.innerHTML = '';

  STAGES.forEach((stage, si) => {
    const stageDeals = list.filter(d => d.stage === stage);
    const total = stageDeals.reduce((s, d) => s + (d.value || 0), 0);

    const col = document.createElement('div');
    col.className = 'column';
    col.innerHTML = `<div class="col-header">
      <div class="col-header-left">
        <div class="col-title" style="display:flex;align-items:center;gap:6px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${STAGE_COLORS[si]};"></span>
          ${esc(stage)}
        </div>
        <div class="col-meta">${fmtVal(total)} · ${stageDeals.length}</div>
      </div>
    </div>`;

    const body = document.createElement('div');
    body.className = 'col-body';
    body.dataset.stage = stage;
    body.addEventListener('dragover', e => { e.preventDefault(); body.classList.add('drag-over'); });
    body.addEventListener('dragleave', e => { if (!body.contains(e.relatedTarget)) body.classList.remove('drag-over'); });
    body.addEventListener('drop', async e => {
      e.preventDefault(); body.classList.remove('drag-over');
      if (S.dragSrcId) {
        const deal = S.deals.find(d => d.id === S.dragSrcId);
        if (deal && deal.stage !== stage) await moveDealStage(S.dragSrcId, stage);
        S.dragSrcId = null;
      }
    });

    if (stageDeals.length === 0) {
      body.innerHTML = '<div class="col-empty">Drop deals here</div>';
    }

    stageDeals.forEach(deal => {
      const card = document.createElement('div');
      card.className = 'deal-card';
      card.draggable = true;
      card.dataset.id = deal.id;

      const labelDot = deal.label ? `<div class="card-label card-label-${(deal.label || '').toLowerCase()}"></div>` : '';
      card.innerHTML = `
        <div class="card-top">
          <div class="card-title">${esc(deal.title)}</div>
          ${labelDot}
        </div>
        <div class="card-sub">${esc(deal.contact_person || deal.organization || '')}</div>
        <div class="card-footer">
          <span class="card-value ${deal.value > 0 ? 'has-value' : ''}">${fmtVal(deal.value, deal.currency)}</span>
          ${deal.expected_close ? '<span class="card-date">' + fmtDate(deal.expected_close) + '</span>' : ''}
          ${deal.warn ? '<span class="card-warn"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg></span>' : ''}
        </div>`;

      card.addEventListener('dragstart', () => { S.dragSrcId = deal.id; card.classList.add('dragging'); });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('click', () => openDealModal(deal.id));
      body.appendChild(card);
    });

    col.appendChild(body);
    board.appendChild(col);
  });
}

function renderDealsList(list) {
  const sorted = sortList(list, S.dealsSortField, S.dealsSortDir);
  const wrap = $('deals-list');
  const arrow = dir => dir === 'asc' ? '↑' : '↓';
  const sortCls = f => f === S.dealsSortField ? 'sorted' : '';

  wrap.innerHTML = `<table class="data-table">
    <thead><tr>
      <th class="${sortCls('title')}" onclick="sortDeals('title')">Deal ${S.dealsSortField === 'title' ? '<span class="sort-arrow">' + arrow(S.dealsSortDir) + '</span>' : ''}</th>
      <th class="${sortCls('contact_person')}" onclick="sortDeals('contact_person')">Contact ${S.dealsSortField === 'contact_person' ? '<span class="sort-arrow">' + arrow(S.dealsSortDir) + '</span>' : ''}</th>
      <th class="${sortCls('organization')}" onclick="sortDeals('organization')">Company ${S.dealsSortField === 'organization' ? '<span class="sort-arrow">' + arrow(S.dealsSortDir) + '</span>' : ''}</th>
      <th class="${sortCls('value')}" onclick="sortDeals('value')">Value ${S.dealsSortField === 'value' ? '<span class="sort-arrow">' + arrow(S.dealsSortDir) + '</span>' : ''}</th>
      <th class="${sortCls('stage')}" onclick="sortDeals('stage')">Stage ${S.dealsSortField === 'stage' ? '<span class="sort-arrow">' + arrow(S.dealsSortDir) + '</span>' : ''}</th>
      <th class="${sortCls('expected_close')}" onclick="sortDeals('expected_close')">Close Date ${S.dealsSortField === 'expected_close' ? '<span class="sort-arrow">' + arrow(S.dealsSortDir) + '</span>' : ''}</th>
    </tr></thead>
    <tbody>${sorted.map(d => `<tr onclick="openDealModal('${d.id}')">
      <td><strong>${esc(d.title)}</strong></td>
      <td>${esc(d.contact_person || '—')}</td>
      <td>${esc(d.organization || '—')}</td>
      <td class="col-value" style="color:${d.value > 0 ? 'var(--accent)' : 'var(--text-3)'}">${fmtVal(d.value, d.currency)}</td>
      <td><span class="badge badge-${STAGES.indexOf(d.stage) % 2 === 0 ? 'blue' : 'purple'}">${esc(d.stage)}</span></td>
      <td class="text-muted">${d.expected_close ? fmtDate(d.expected_close) : '—'}</td>
    </tr>`).join('')}</tbody>
  </table>`;

  if (sorted.length === 0) wrap.innerHTML = renderEmpty('No deals found', 'Adjust your filters or create a new deal.', 'openDealModal()', '+ New Deal');
}

export function sortDeals(field) {
  if (S.dealsSortField === field) S.dealsSortDir = S.dealsSortDir === 'asc' ? 'desc' : 'asc';
  else { S.dealsSortField = field; S.dealsSortDir = 'asc'; }
  renderDeals();
}

async function moveDealStage(dealId, newStage) {
  const { data, error } = await sb.from('deals').update({ stage: newStage }).eq('id', dealId).select().single();
  if (error) { toast('Error: ' + error.message); return; }
  const idx = S.deals.findIndex(d => d.id === dealId);
  if (idx !== -1) S.deals[idx] = data;
  emitDataChanged();
}

// ── Deal Modal ──────────────────────────────────────────────

export function buildStageTrack(trackId, labelId) {
  const track = $(trackId);
  track.innerHTML = '';
  STAGES.forEach((_, i) => {
    const step = document.createElement('div');
    step.className = 'stage-step' + (i === S.dealStageIdx ? ' active' : '') + (i < S.dealStageIdx ? ' done' : '');
    step.onclick = () => {
      S.dealStageIdx = i;
      track.querySelectorAll('.stage-step').forEach((s, j) => {
        s.className = 'stage-step' + (j === i ? ' active' : '') + (j < i ? ' done' : '');
      });
      $(labelId).textContent = STAGES[i];
    };
    track.appendChild(step);
  });
  $(labelId).textContent = STAGES[S.dealStageIdx];
}

export function openDealModal(id) {
  S.editingDealId = id || null;
  const isEdit = !!id;
  $('deal-modal-title').textContent = isEdit ? 'Edit Deal' : 'New Deal';
  $('deal-save-btn').textContent = isEdit ? 'Save Changes' : 'Create Deal';
  $('deal-delete-btn').style.display = isEdit ? '' : 'none';
  $('deal-created-wrap').style.display = isEdit ? '' : 'none';

  if (isEdit) {
    const d = S.deals.find(x => x.id === id);
    if (!d) return;
    $('deal-title').value = d.title || '';
    $('deal-contact').value = d.contact_person || '';
    $('deal-org').value = d.organization || '';
    $('deal-value').value = d.value || '';
    $('deal-currency').value = d.currency || 'USD';
    $('deal-label').value = d.label || '';
    $('deal-prob').value = d.probability || '';
    $('deal-close').value = d.expected_close || '';
    $('deal-source').value = d.source_channel || '';
    $('deal-notes').value = d.notes || '';
    $('deal-phone').value = d.phone || '';
    $('deal-email').value = d.email || '';
    $('deal-visible').value = d.visible_to || 'Only me';
    $('deal-created-at').textContent = fmtDate(d.created_at);
    S.dealStageIdx = Math.max(0, STAGES.indexOf(d.stage));
  } else {
    ['deal-title', 'deal-contact', 'deal-org', 'deal-value', 'deal-prob', 'deal-close', 'deal-notes', 'deal-phone', 'deal-email'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    ['deal-currency', 'deal-label', 'deal-source', 'deal-visible'].forEach(id => { const el = $(id); if (el) el.selectedIndex = 0; });
    S.dealStageIdx = 0;
  }

  buildStageTrack('deal-stage-track', 'deal-stage-label');
  $('modal-deal').classList.add('open');
  setTimeout(() => $('deal-title').focus(), 100);
}

export function closeDealModal() {
  $('modal-deal').classList.remove('open');
  S.editingDealId = null;
}

export async function saveDeal() {
  const btn = $('deal-save-btn');
  const title = $('deal-title').value.trim();
  const org = $('deal-org').value.trim();
  if (!title && !org) { toast('Enter a title or organization.'); return; }

  btn.disabled = true;
  const payload = {
    title: title || org,
    organization: org || null,
    contact_person: $('deal-contact').value.trim() || null,
    value: parseFloat($('deal-value').value) || 0,
    currency: $('deal-currency').value,
    stage: STAGES[S.dealStageIdx],
    pipeline: 'Counting Tool',
    label: $('deal-label').value || null,
    probability: parseInt($('deal-prob').value) || null,
    expected_close: $('deal-close').value || null,
    source_channel: $('deal-source').value || null,
    visible_to: $('deal-visible').value,
    phone: $('deal-phone').value.trim() || null,
    email: $('deal-email').value.trim() || null,
    notes: $('deal-notes').value.trim() || null,
    warn: true,
  };

  let result;
  if (S.editingDealId) {
    result = await sb.from('deals').update(payload).eq('id', S.editingDealId).select().single();
  } else {
    payload.owner_id = S.user.id;
    result = await sb.from('deals').insert(payload).select().single();
  }

  btn.disabled = false;
  if (result.error) { toast('Error: ' + result.error.message); return; }

  if (S.editingDealId) {
    const idx = S.deals.findIndex(d => d.id === S.editingDealId);
    if (idx !== -1) S.deals[idx] = result.data;
  } else {
    S.deals.push(result.data);
  }

  closeDealModal();
  emitDataChanged();
  toast(S.editingDealId ? 'Deal updated.' : 'Deal created.');
}

export async function deleteDeal() {
  if (!confirm('Delete this deal? This cannot be undone.')) return;
  const btn = $('deal-delete-btn');
  btn.disabled = true;
  const { error } = await sb.from('deals').delete().eq('id', S.editingDealId);
  btn.disabled = false;
  if (error) { toast('Error: ' + error.message); return; }
  S.deals = S.deals.filter(d => d.id !== S.editingDealId);
  closeDealModal();
  emitDataChanged();
  toast('Deal deleted.');
}
