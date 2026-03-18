import { neon } from '@neondatabase/serverless';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.headers.get('x-admin-password')?.trim() !== env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = neon(env.POSTGRES_URL);

  if (request.method === 'GET') {
    try {
      const rows = await sql`SELECT key, value FROM settings`;
      const settings = {};
      rows.forEach(row => { settings[row.key] = row.value; });
      return Response.json(settings);
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      const { notification_email } = await request.json();
      if (!notification_email) {
        return Response.json({ error: 'notification_email is required.' }, { status: 400 });
      }
      await sql`
        INSERT INTO settings (key, value) VALUES ('notification_email', ${notification_email})
        ON CONFLICT (key) DO UPDATE SET value = ${notification_email}
      `;
      return Response.json({ success: true });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
