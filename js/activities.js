import { S } from './state.js';
import { sb } from './supabase.js';
import { $, esc, fmtDate, toast, renderEmpty, emitDataChanged } from './utils.js';

export function setActivityFilter(f) {
  S.activityFilter = f;
  document.querySelectorAll('.af').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
  renderActivities();
}

function getFilteredActivities() {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let list = [...S.activities];

  if (S.activityFilter === 'today') list = list.filter(a => !a.completed && a.due_date && new Date(a.due_date) <= todayEnd && new Date(a.due_date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  else if (S.activityFilter === 'upcoming') list = list.filter(a => !a.completed && a.due_date && new Date(a.due_date) > todayEnd);
  else if (S.activityFilter === 'overdue') list = list.filter(a => !a.completed && a.due_date && new Date(a.due_date) < now);
  else if (S.activityFilter === 'completed') list = list.filter(a => a.completed);

  return list;
}

export function renderActivities() {
  const body = $('activities-body');
  if (!S.tablesAvailable.activities) {
    body.innerHTML = renderEmpty('Activities not available', 'Run the updated schema.sql in Supabase SQL Editor to enable activities.', '', '');
    $('activities-meta').textContent = '';
    return;
  }

  const list = getFilteredActivities();
  $('activities-meta').textContent = list.length + ' activit' + (list.length !== 1 ? 'ies' : 'y');

  if (list.length === 0) {
    body.innerHTML = renderEmpty('No activities', 'Create tasks, calls, emails, and meetings to stay on top of your pipeline.', 'openActivityModal()', '+ New Activity');
    return;
  }

  body.innerHTML = list.map(a => {
    const now = new Date();
    const isOverdue = !a.completed && a.due_date && new Date(a.due_date) < now;
    const typeIcon = {
      task: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
      call: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      email: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>',
      meeting: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    }[a.type || 'task'];
    const typeClass = 'type-' + (a.type || 'task');
    const priorityClass = 'priority-' + (a.priority || 'medium');
    const linkedDeal = a.deal_id ? S.deals.find(d => d.id === a.deal_id) : null;
    const linkedContact = a.contact_id ? S.contacts.find(c => c.id === a.contact_id) : null;

    return `<div class="activity-item ${a.completed ? 'completed' : ''}">
      <div class="activity-check ${a.completed ? 'checked' : ''}" onclick="toggleActivity('${a.id}')">
        ${a.completed ? '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </div>
      <div class="activity-type-icon ${typeClass}">${typeIcon}</div>
      <div class="activity-body">
        <div class="activity-title">${esc(a.title)}</div>
        <div class="activity-meta">
          ${a.due_date ? `<span class="activity-meta-item ${isOverdue ? 'priority-high' : ''}">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${fmtDate(a.due_date)}${isOverdue ? ' (overdue)' : ''}
          </span>` : ''}
          <span class="activity-meta-item ${priorityClass}">${esc((a.priority || 'medium').charAt(0).toUpperCase() + (a.priority || 'medium').slice(1))}</span>
          ${linkedDeal ? `<span class="activity-meta-item">◆ ${esc(linkedDeal.title)}</span>` : ''}
          ${linkedContact ? `<span class="activity-meta-item">👤 ${esc(linkedContact.full_name)}</span>` : ''}
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="openActivityModal('${a.id}')" style="flex-shrink:0;">Edit</button>
    </div>`;
  }).join('');
}

export async function toggleActivity(id) {
  const a = S.activities.find(x => x.id === id);
  if (!a) return;
  const completed = !a.completed;
  const { data, error } = await sb.from('activities').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', id).select().single();
  if (error) { toast('Error: ' + error.message); return; }
  const idx = S.activities.findIndex(x => x.id === id);
  if (idx !== -1) S.activities[idx] = data;
  emitDataChanged();
}

export function openActivityModal(id) {
  S.editingActivityId = id || null;
  const isEdit = !!id;
  $('activity-modal-title').textContent = isEdit ? 'Edit Activity' : 'New Activity';
  $('activity-save-btn').textContent = isEdit ? 'Save Changes' : 'Create Activity';
  $('activity-delete-btn').style.display = isEdit ? '' : 'none';

  const dealSel = $('activity-deal');
  const contactSel = $('activity-contact-link');
  dealSel.innerHTML = '<option value="">None</option>' + S.deals.map(d => `<option value="${d.id}">${esc(d.title)}</option>`).join('');
  contactSel.innerHTML = '<option value="">None</option>' + S.contacts.map(c => `<option value="${c.id}">${esc(c.full_name)}</option>`).join('');

  if (isEdit) {
    const a = S.activities.find(x => x.id === id);
    if (!a) return;
    $('activity-type').value = a.type || 'task';
    $('activity-priority').value = a.priority || 'medium';
    $('activity-title').value = a.title || '';
    $('activity-desc').value = a.description || '';
    $('activity-due').value = a.due_date ? a.due_date.slice(0, 16) : '';
    $('activity-deal').value = a.deal_id || '';
    $('activity-contact-link').value = a.contact_id || '';
  } else {
    ['activity-title', 'activity-desc', 'activity-due'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    $('activity-type').value = 'task';
    $('activity-priority').value = 'medium';
    dealSel.value = '';
    contactSel.value = '';
  }

  $('modal-activity').classList.add('open');
  setTimeout(() => $('activity-title').focus(), 100);
}

export function closeActivityModal() {
  $('modal-activity').classList.remove('open');
  S.editingActivityId = null;
}

export async function saveActivity() {
  if (!S.tablesAvailable.activities) { toast('Activities table not available.'); return; }
  const title = $('activity-title').value.trim();
  if (!title) { toast('Title is required.'); return; }

  const btn = $('activity-save-btn');
  btn.disabled = true;

  const payload = {
    type: $('activity-type').value,
    title,
    description: $('activity-desc').value.trim() || null,
    due_date: $('activity-due').value || null,
    deal_id: $('activity-deal').value || null,
    contact_id: $('activity-contact-link').value || null,
    priority: $('activity-priority').value,
  };

  let result;
  if (S.editingActivityId) {
    result = await sb.from('activities').update(payload).eq('id', S.editingActivityId).select().single();
  } else {
    payload.owner_id = S.user.id;
    result = await sb.from('activities').insert(payload).select().single();
  }

  btn.disabled = false;
  if (result.error) { toast('Error: ' + result.error.message); return; }

  if (S.editingActivityId) {
    const idx = S.activities.findIndex(a => a.id === S.editingActivityId);
    if (idx !== -1) S.activities[idx] = result.data;
  } else {
    S.activities.push(result.data);
  }

  closeActivityModal();
  emitDataChanged();
  toast(S.editingActivityId ? 'Activity updated.' : 'Activity created.');
}

export async function deleteActivity() {
  if (!confirm('Delete this activity?')) return;
  const { error } = await sb.from('activities').delete().eq('id', S.editingActivityId);
  if (error) { toast('Error: ' + error.message); return; }
  S.activities = S.activities.filter(a => a.id !== S.editingActivityId);
  closeActivityModal();
  emitDataChanged();
  toast('Activity deleted.');
}
