import { neon } from '@neondatabase/serverless';

export async function onRequestGet(context) {
  const { request, env } = context;

  if (request.headers.get('x-admin-password') !== env.ADMIN_PASSWORD) {
    return Response.json({
      error: 'Unauthorized',
      received_length: request.headers.get('x-admin-password')?.length ?? null,
      expected_length: env.ADMIN_PASSWORD?.length ?? null,
    }, { status: 401 });
  }

  try {
    const sql = neon(env.POSTGRES_URL);

    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        event_type TEXT,
        attendees TEXT,
        event_date TEXT,
        event_time TEXT,
        referral TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;

    await sql`
      INSERT INTO settings (key, value)
      VALUES ('notification_email', ${env.DEFAULT_NOTIFICATION_EMAIL || 'acpaulley@gmail.com'})
      ON CONFLICT (key) DO NOTHING
    `;

    return Response.json({ success: true, message: 'Database initialized successfully.' });
  } catch (err) {
    console.error('Setup error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
