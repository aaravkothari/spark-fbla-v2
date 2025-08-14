import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

// Build a server client that reads the caller's session from Next cookies.
async function createServerAnonClient() {
  const cookieStore = await cookies(); // <-- your env has async cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!, // or your publishable anon key var
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        // For route handlers, we usually don't set/remove cookies here.
        set: () => {},
        remove: () => {},
      },
    }
  );
}

async function ensureRequesterIsAdmin() {
  const supa = await createServerAnonClient();

  const { data: { user }, error } = await supa.auth.getUser();
  if (error || !user) return null;

  const { data: me, error: meErr } = await supa
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (meErr || !me || me.role !== 'Admin') return null;
  return { supa, user };
}

// PATCH: change a user's role (including "approve" -> set role=requested_role)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ok = await ensureRequesterIsAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const body = await req.json().catch(() => ({}));
  const { mode, role } = body as { mode?: 'approve' | 'set'; role?: string };

  if (mode === 'approve') {
    const { data: u, error: selErr } = await admin
      .from('users')
      .select('requested_role')
      .eq('id', params.id)
      .maybeSingle();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!u?.requested_role) {
      return NextResponse.json({ error: 'No requested_role to approve.' }, { status: 400 });
    }
    const { error: upErr } = await admin
      .from('users')
      .update({ role: u.requested_role /* , requested_role: null */ })
      .eq('id', params.id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (mode === 'set') {
    if (!role) return NextResponse.json({ error: 'Missing role' }, { status: 400 });
    const { error: upErr } = await admin
      .from('users')
      .update({ role })
      .eq('id', params.id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
}

// DELETE: remove user entirely (auth.users + public.users)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ok = await ensureRequesterIsAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // 1) delete from Auth
  const { error: delAuthErr } = await admin.auth.admin.deleteUser(params.id);
  if (delAuthErr) {
    return NextResponse.json({ error: delAuthErr.message }, { status: 500 });
  }

  // 2) delete any remaining row in public.users
  const { error: delRowErr } = await admin.from('users').delete().eq('id', params.id);
  if (delRowErr) {
    // OK to return 200; row may already be gone due to FK cascades or earlier cleanup
    return NextResponse.json({ warning: delRowErr.message, ok: true });
  }

  return NextResponse.json({ ok: true });
}
