const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`SELECT key, value FROM settings`;
      const settings = {};
      result.rows.forEach(row => { settings[row.key] = row.value; });
      return res.status(200).json(settings);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { notification_email } = req.body || {};
      if (!notification_email) {
        return res.status(400).json({ error: 'notification_email is required.' });
      }
      await sql`
        INSERT INTO settings (key, value)
        VALUES ('notification_email', ${notification_email})
        ON CONFLICT (key) DO UPDATE SET value = ${notification_email}
      `;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
