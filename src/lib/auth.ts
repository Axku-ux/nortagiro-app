import { supabase } from './supabase';
import type { UserRole, Organization, User } from './database.types';

// ─── Types ──────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// ─── Auth Functions ─────────────────────────────────────

/**
 * Sign up a new admin user and create their organization.
 * This is the initial setup flow — only the first user uses this.
 */
export async function signUp({ email, password, fullName, organizationName }: SignUpData) {
  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No se pudo crear el usuario.');

  // 2. Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert([{ name: organizationName, settings: {} }] as unknown as never[])
    .select()
    .single();

  if (orgError) throw orgError;
  if (!org) throw new Error('No se pudo crear la organización.');

  const orgData = org as unknown as Organization;

  // 3. Create platform user linked to auth user
  const { error: userError } = await supabase
    .from('users')
    .insert([{
      organization_id: orgData.id,
      auth_uid: authData.user.id,
      email,
      full_name: fullName,
      role: 'admin',
    }] as unknown as never[]);

  if (userError) throw userError;

  return { user: authData.user, organization: orgData };
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Fetch the platform user profile (role, org, etc.) for the currently
 * authenticated Supabase Auth user.
 */
export async function fetchUserProfile(authUid: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_uid', authUid)
    .single();

  if (error || !data) return null;

  const userData = data as unknown as User;

  return {
    id: userData.id,
    email: userData.email,
    fullName: userData.full_name,
    role: userData.role,
    organizationId: userData.organization_id,
  };
}

/**
 * Check if any organization exists (used to determine if we show
 * the register flow or the login flow).
 */
export async function hasOrganization(): Promise<boolean> {
  const { count, error } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  if (error) return false;
  return (count ?? 0) > 0;
}
