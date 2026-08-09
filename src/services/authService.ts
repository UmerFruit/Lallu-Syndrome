import type { User, AuthState } from '@/types';

const AUTH_KEY = 'ls_auth_user';

type AuthCallback = (state: AuthState) => void;
const listeners = new Set<AuthCallback>();

function notify(state: AuthState) {
  listeners.forEach((cb) => cb(state));
}

export function onAuthChange(cb: AuthCallback): () => void {
  listeners.add(cb);
  cb(getAuthState());
  return () => listeners.delete(cb);
}

export function getAuthState(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      const user = JSON.parse(stored) as User;
      return { user, isLoading: false };
    }
  } catch {
    // ignore
  }
  return { user: null, isLoading: false };
}

export async function login(email: string, _password: string): Promise<User> {
  await simulateDelay(400);
  if (!email.includes('@')) {
    throw new Error('Invalid email or password.');
  }
  const user: User = {
    id: crypto.randomUUID(),
    email,
    name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  notify({ user, isLoading: false });
  return user;
}

export async function signup(name: string, email: string, _password: string): Promise<User> {
  await simulateDelay(500);
  if (!email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  const user: User = {
    id: crypto.randomUUID(),
    email,
    name,
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  notify({ user, isLoading: false });
  return user;
}

export async function forgotPassword(email: string): Promise<void> {
  await simulateDelay(400);
  if (!email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
}

export async function resetPassword(_token: string, _password: string): Promise<void> {
  await simulateDelay(500);
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
  notify({ user: null, isLoading: false });
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
