import { sb } from './supabase.js';
import { $ } from './utils.js';

export function toggleAuth(view) {
  $('auth-login-view').style.display = view === 'login' ? '' : 'none';
  $('auth-signup-view').style.display = view === 'signup' ? '' : 'none';
}

export async function handleSignIn() {
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const btn = $('login-btn'), err = $('login-error');
  err.classList.remove('show');
  if (!email || !password) { err.textContent = 'Please fill in all fields.'; err.classList.add('show'); return; }
  btn.disabled = true; btn.textContent = 'Signing in...';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  btn.disabled = false; btn.textContent = 'Sign in';
  if (error) { err.textContent = error.message; err.classList.add('show'); }
}

export async function handleSignUp() {
  const name = $('signup-name').value.trim();
  const email = $('signup-email').value.trim();
  const password = $('signup-password').value;
  const btn = $('signup-btn'), err = $('signup-error');
  err.classList.remove('show');
  if (!email || !password) { err.textContent = 'Please fill in all fields.'; err.classList.add('show'); return; }
  if (password.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.classList.add('show'); return; }
  btn.disabled = true; btn.textContent = 'Creating...';
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
  btn.disabled = false; btn.textContent = 'Create account';
  if (error) { err.textContent = error.message; err.classList.add('show'); return; }
  if (data.user && !data.session) {
    err.style.color = 'var(--accent)'; err.style.background = 'var(--accent-dim)';
    err.textContent = 'Check your email to confirm your account!';
    err.classList.add('show');
  }
}

export async function handleSignOut() {
  if (!confirm('Sign out?')) return;
  await sb.auth.signOut();
}
