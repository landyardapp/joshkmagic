const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
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
      VALUES ('notification_email', ${process.env.DEFAULT_NOTIFICATION_EMAIL || 'acpaulley@gmail.com'})
      ON CONFLICT (key) DO NOTHING
    `;

    return res.status(200).json({ success: true, message: 'Database initialized successfully.' });
  } catch (err) {
    console.error('Setup error:', err);
    return res.status(500).json({ error: err.message });
  }
};
