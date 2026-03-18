const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sql`SELECT * FROM submissions ORDER BY created_at DESC`;
    return res.status(200).json({ submissions: result.rows });
  } catch (err) {
    console.error('Submissions fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
};
