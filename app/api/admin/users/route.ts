// /app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

// Build a server client to read the caller's session from cookies
async function createServerAnonClient() {
  const cookieStore: any = typeof (cookies as any) === 'function'
    ? await (cookies as any)()
    : (cookies as any);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

async function ensureRequesterIsAdmin() {
  // 1) Verify the requester is authenticated
  const supa = await createServerAnonClient();
  const { data: { user }, error } = await supa.auth.getUser();
  if (error || !user) return null;

  // 2) Use **service role** to read their role (bypasses RLS entirely)
  const admin = createAdminClient();
  const { data: me, error: meErr } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (meErr || !me || me.role !== 'Admin') return null;
  return { user };
}

export async function GET() {
  const ok = await ensureRequesterIsAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('id, email, first_name, last_name, student_id, school, requested_role, role, created_at, last_sign_in_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}
