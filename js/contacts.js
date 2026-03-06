import { S } from './state.js';
import { sb } from './supabase.js';
import { $, esc, fmtDate, avatarColor, initials, toast, renderEmpty, emitDataChanged } from './utils.js';

export function renderContacts() {
  const body = $('contacts-body');
  if (!S.tablesAvailable.contacts) {
    body.innerHTML = renderEmpty('Contacts not available', 'Run the updated schema.sql in Supabase SQL Editor to enable contacts.', '', '');
    $('contacts-meta').textContent = '';
    return;
  }

  const q = ($('contacts-search')?.value || '').toLowerCase().trim();
  let list = [...S.contacts];
  if (q) list = list.filter(c => (c.full_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q));

  $('contacts-meta').textContent = list.length + ' contact' + (list.length !== 1 ? 's' : '');

  if (list.length === 0) {
    body.innerHTML = renderEmpty('No contacts yet', 'Add your first contact to start building your network.', 'openContactModal()', '+ New Contact');
    return;
  }

  body.innerHTML = `<table class="data-table">
    <thead><tr>
      <th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Role</th><th>Label</th><th>Added</th>
    </tr></thead>
    <tbody>${list.map(c => {
      const color = avatarColor(c.full_name);
      const ini = initials(c.full_name);
      const labelBadge = c.label ? `<span class="badge badge-gray">${esc(c.label)}</span>` : '—';
      return `<tr onclick="openContactModal('${c.id}')">
        <td><div class="contact-row"><div class="contact-avatar" style="background:${color}">${ini}</div><strong>${esc(c.full_name)}</strong></div></td>
        <td>${esc(c.email || '—')}</td>
        <td class="mono">${esc(c.phone || '—')}</td>
        <td>${esc(c.company_name || '—')}</td>
        <td class="text-muted">${esc(c.role || '—')}</td>
        <td>${labelBadge}</td>
        <td class="text-muted">${fmtDate(c.created_at)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

export function openContactModal(id) {
  S.editingContactId = id || null;
  const isEdit = !!id;
  $('contact-modal-title').textContent = isEdit ? 'Edit Contact' : 'New Contact';
  $('contact-save-btn').textContent = isEdit ? 'Save Changes' : 'Create Contact';
  $('contact-delete-btn').style.display = isEdit ? '' : 'none';

  if (isEdit) {
    const c = S.contacts.find(x => x.id === id);
    if (!c) return;
    $('contact-name').value = c.full_name || '';
    $('contact-email').value = c.email || '';
    $('contact-phone').value = c.phone || '';
    $('contact-company').value = c.company_name || '';
    $('contact-role').value = c.role || '';
    $('contact-label').value = c.label || '';
    $('contact-notes').value = c.notes || '';
  } else {
    ['contact-name', 'contact-email', 'contact-phone', 'contact-company', 'contact-role', 'contact-notes'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    $('contact-label').selectedIndex = 0;
  }

  $('modal-contact').classList.add('open');
  setTimeout(() => $('contact-name').focus(), 100);
}

export function closeContactModal() {
  $('modal-contact').classList.remove('open');
  S.editingContactId = null;
}

export async function saveContact() {
  if (!S.tablesAvailable.contacts) { toast('Contacts table not available.'); return; }
  const name = $('contact-name').value.trim();
  if (!name) { toast('Name is required.'); return; }

  const btn = $('contact-save-btn');
  btn.disabled = true;

  const payload = {
    full_name: name,
    email: $('contact-email').value.trim() || null,
    phone: $('contact-phone').value.trim() || null,
    company_name: $('contact-company').value.trim() || null,
    role: $('contact-role').value.trim() || null,
    label: $('contact-label').value || null,
    notes: $('contact-notes').value.trim() || null,
  };

  let result;
  if (S.editingContactId) {
    result = await sb.from('contacts').update(payload).eq('id', S.editingContactId).select().single();
  } else {
    payload.owner_id = S.user.id;
    result = await sb.from('contacts').insert(payload).select().single();
  }

  btn.disabled = false;
  if (result.error) { toast('Error: ' + result.error.message); return; }

  if (S.editingContactId) {
    const idx = S.contacts.findIndex(c => c.id === S.editingContactId);
    if (idx !== -1) S.contacts[idx] = result.data;
  } else {
    S.contacts.push(result.data);
  }

  closeContactModal();
  emitDataChanged();
  toast(S.editingContactId ? 'Contact updated.' : 'Contact added.');
}

export async function deleteContact() {
  if (!confirm('Delete this contact?')) return;
  const btn = $('contact-delete-btn');
  btn.disabled = true;
  const { error } = await sb.from('contacts').delete().eq('id', S.editingContactId);
  btn.disabled = false;
  if (error) { toast('Error: ' + error.message); return; }
  S.contacts = S.contacts.filter(c => c.id !== S.editingContactId);
  closeContactModal();
  emitDataChanged();
  toast('Contact deleted.');
}
