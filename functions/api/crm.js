import { neon } from '@neondatabase/serverless';

export async function onRequestPatch(context) {
  const { request, env } = context;

  if (request.headers.get('x-admin-password')?.trim() !== env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { contacted_called, contacted_emailed, booked } = body;

  try {
    const sql = neon(env.POSTGRES_URL);
    await sql`
      UPDATE submissions SET
        contacted_called  = ${contacted_called  ?? false},
        contacted_emailed = ${contacted_emailed ?? false},
        booked            = ${booked            ?? false}
      WHERE id = ${id}
    `;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
