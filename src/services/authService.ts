import type { User, AuthState } from '@/types';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type AuthCallback = (state: AuthState) => void;

function mapSupabaseUser(user: SupabaseUser): User {
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata.name ?? '',
    avatar: user.user_metadata.avatar,
  };
}

export function onAuthChange(cb: AuthCallback): () => void {

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    cb({
      user: session?.user ? mapSupabaseUser(session.user) : null,
      isLoading: false
    })
  })
  return () => subscription.unsubscribe();
}

export async function getAuthState(): Promise<AuthState> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    user: session?.user ? mapSupabaseUser(session.user) : null,
    isLoading: false,
  };
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) { throw new Error(error.message);}

  return data.user ? mapSupabaseUser(data.user) : null;
}

export async function signup(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: {name} }
  });

  if (error) { throw new Error(error.message);}

  return data.user ? mapSupabaseUser(data.user) : null;
}

export async function forgotPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email, { redirectTo: `${window.location.origin}/reset-password` }
  );

  if (error) { throw new Error(error.message);}
}

export async function resetPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) { throw new Error(error.message);}
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) { throw new Error(error.message);}
}
