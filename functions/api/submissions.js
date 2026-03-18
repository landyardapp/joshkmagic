import { neon } from '@neondatabase/serverless';

export async function onRequestGet(context) {
  const { request, env } = context;

  if (request.headers.get('x-admin-password') !== env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = neon(env.POSTGRES_URL);
    const rows = await sql`SELECT * FROM submissions ORDER BY created_at DESC`;
    return Response.json({ submissions: rows });
  } catch (err) {
    console.error('Submissions error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
