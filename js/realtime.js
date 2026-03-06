import { S } from './state.js';
import { sb } from './supabase.js';
import { emitDataChanged } from './utils.js';

export function setupRealtime() {
  sb.channel('deals-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deals', filter: `owner_id=eq.${S.user.id}` }, payload => {
      if (payload.eventType === 'INSERT') {
        if (!S.deals.find(d => d.id === payload.new.id)) S.deals.push(payload.new);
      } else if (payload.eventType === 'UPDATE') {
        const idx = S.deals.findIndex(d => d.id === payload.new.id);
        if (idx !== -1) S.deals[idx] = payload.new;
      } else if (payload.eventType === 'DELETE') {
        S.deals = S.deals.filter(d => d.id !== payload.old.id);
      }
      emitDataChanged();
    })
    .subscribe();

  if (S.tablesAvailable.activities) {
    sb.channel('activities-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `owner_id=eq.${S.user.id}` }, payload => {
        if (payload.eventType === 'INSERT') {
          if (!S.activities.find(a => a.id === payload.new.id)) S.activities.push(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          const idx = S.activities.findIndex(a => a.id === payload.new.id);
          if (idx !== -1) S.activities[idx] = payload.new;
        } else if (payload.eventType === 'DELETE') {
          S.activities = S.activities.filter(a => a.id !== payload.old.id);
        }
        emitDataChanged();
      })
      .subscribe();
  }

  if (S.tablesAvailable.contacts) {
    sb.channel('contacts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts', filter: `owner_id=eq.${S.user.id}` }, payload => {
        if (payload.eventType === 'INSERT') {
          if (!S.contacts.find(c => c.id === payload.new.id)) S.contacts.push(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          const idx = S.contacts.findIndex(c => c.id === payload.new.id);
          if (idx !== -1) S.contacts[idx] = payload.new;
        } else if (payload.eventType === 'DELETE') {
          S.contacts = S.contacts.filter(c => c.id !== payload.old.id);
        }
        emitDataChanged();
      })
      .subscribe();
  }
}
