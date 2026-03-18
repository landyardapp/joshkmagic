import { neon } from '@neondatabase/serverless';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const sql = neon(env.POSTGRES_URL);
    const rows = await sql`SELECT * FROM google_reviews ORDER BY created_at DESC`;
    return Response.json({ reviews: rows.map(r => ({
      id: r.id,
      author: r.author,
      text: r.text,
      time: new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    })) });
  } catch (err) {
    console.error('Reviews error:', err);
    return Response.json({ reviews: [] });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.headers.get('x-admin-password')?.trim() !== env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { author, text } = body;
  if (!author || !text) {
    return Response.json({ error: 'Author and text are required.' }, { status: 400 });
  }

  try {
    const sql = neon(env.POSTGRES_URL);
    const rows = await sql`
      INSERT INTO google_reviews (author, text) VALUES (${author.trim()}, ${text.trim()})
      RETURNING *
    `;
    return Response.json({ success: true, review: rows[0] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  if (request.headers.get('x-admin-password')?.trim() !== env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

  try {
    const sql = neon(env.POSTGRES_URL);
    await sql`DELETE FROM google_reviews WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
