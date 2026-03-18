import { neon } from '@neondatabase/serverless';

export async function onRequestDelete(context) {
  const { request, env } = context;

  if (request.headers.get('x-admin-password') !== env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Submission ID is required.' }, { status: 400 });
  }

  try {
    const sql = neon(env.POSTGRES_URL);
    await sql`DELETE FROM submissions WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
