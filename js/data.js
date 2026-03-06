import { S } from './state.js';
import { sb } from './supabase.js';
import { DEMO_DEALS } from './config.js';
import { $, toast } from './utils.js';

export async function loadAllData() {
  const uid = S.user.id;

  const dealsRes = await sb.from('deals').select('*').eq('owner_id', uid).order('created_at', { ascending: true });
  if (dealsRes.error) toast('Error loading deals: ' + dealsRes.error.message);
  S.deals = dealsRes.data || [];

  if (S.deals.length === 0) {
    await seedDemoDeals();
  }

  await loadContacts();
  await loadActivities();
  updateNavCounts();
}

async function loadContacts() {
  try {
    const res = await sb.from('contacts').select('*').eq('owner_id', S.user.id).order('full_name');
    if (res.error) throw res.error;
    S.contacts = res.data || [];
    S.tablesAvailable.contacts = true;
  } catch {
    S.contacts = [];
    S.tablesAvailable.contacts = false;
  }
}

async function loadActivities() {
  try {
    const res = await sb.from('activities').select('*').eq('owner_id', S.user.id).order('due_date', { ascending: true });
    if (res.error) throw res.error;
    S.activities = res.data || [];
    S.tablesAvailable.activities = true;
  } catch {
    S.activities = [];
    S.tablesAvailable.activities = false;
  }
}

async function seedDemoDeals() {
  const rows = DEMO_DEALS.map(d => ({ ...d, owner_id: S.user.id, currency: 'USD', pipeline: 'Counting Tool', visible_to: 'Only me' }));
  const { data, error } = await sb.from('deals').insert(rows).select();
  if (!error) S.deals = data || [];
}

export function updateNavCounts() {
  const dc = $('nav-deals-count');
  const cc = $('nav-contacts-count');
  const ac = $('nav-activities-count');
  dc.textContent = S.deals.length || '';
  cc.textContent = S.contacts.length || '';
  const overdue = S.activities.filter(a => !a.completed && a.due_date && new Date(a.due_date) < new Date()).length;
  ac.textContent = overdue || '';
  ac.classList.toggle('warn', overdue > 0);
}
