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

  // 2. Create organization with explicit UUID
  const orgId = crypto.randomUUID();
  const { error: orgError } = await supabase
    .from('organizations')
    .insert([{ id: orgId, name: organizationName, settings: {} }] as unknown as never[]);

  if (orgError) throw orgError;

  // 3. Create platform user linked to auth user
  const { error: userError } = await supabase
    .from('users')
    .insert([{
      organization_id: orgId,
      auth_uid: authData.user.id,
      email,
      full_name: fullName,
      role: 'admin',
    }] as unknown as never[]);

  if (userError) throw userError;

  return { user: authData.user, organizationId: orgId };
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
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('auth_uid', authUid)
    .maybeSingle();

  if (data) {
    const userData = data as unknown as User;
    return {
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name,
      role: userData.role,
      organizationId: userData.organization_id,
    };
  }

  // Auto-heal: If auth.users user exists but public.users row is missing
  // (e.g. failed signup before RLS policy was added), auto-create org and user profile.
  try {
    const { data: authUserData } = await supabase.auth.getUser();
    if (!authUserData?.user) return null;

    const email = authUserData.user.email || '';
    const fullName = authUserData.user.user_metadata?.full_name || 'Admin';

    // Check if any org exists, or create a new one with explicit UUID
    let orgId: string;
    const { data: existingOrgs } = await supabase.from('organizations').select('id').limit(1);
    if (existingOrgs && existingOrgs.length > 0) {
      orgId = (existingOrgs[0] as { id: string }).id;
    } else {
      orgId = crypto.randomUUID();
      const { error: createOrgErr } = await supabase
        .from('organizations')
        .insert([{ id: orgId, name: 'NortaGiro Org', settings: {} }] as unknown as never[]);
      if (createOrgErr) return null;
    }

    // Insert user into public.users with explicit UUID
    const userId = crypto.randomUUID();
    const { error: createErr } = await supabase
      .from('users')
      .insert([{
        id: userId,
        organization_id: orgId,
        auth_uid: authUid,
        email,
        full_name: fullName,
        role: 'admin',
      }] as unknown as never[]);

    if (!createErr) {
      return {
        id: userId,
        email,
        fullName,
        role: 'admin',
        organizationId: orgId,
      };
    }
  } catch (err) {
    console.error('Auto-heal user profile error:', err);
  }

  return null;
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
