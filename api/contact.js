const { sql } = require('@vercel/postgres');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, eventType, attendees, eventDate, eventTime, referral, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  try {
    // Save to database
    await sql`
      INSERT INTO submissions (name, email, phone, event_type, attendees, event_date, event_time, referral, message)
      VALUES (
        ${name},
        ${email},
        ${phone || null},
        ${eventType || null},
        ${attendees || null},
        ${eventDate || null},
        ${eventTime || null},
        ${referral || null},
        ${message}
      )
    `;

    // Get notification email from settings
    const settingsRes = await sql`SELECT value FROM settings WHERE key = 'notification_email' LIMIT 1`;
    const to = settingsRes.rows[0]?.value || process.env.GMAIL_USER;

    // Send email notification
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Josh Kurzban Magic" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: email,
      subject: `New Booking Inquiry — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #D4AF37; margin-bottom: 24px;">New Booking Inquiry</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 10px 8px; font-weight: bold; width: 140px; vertical-align: top;">Name</td><td style="padding: 10px 8px;">${name}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Email</td><td style="padding: 10px 8px;"><a href="mailto:${email}" style="color: #D4AF37;">${email}</a></td></tr>
            <tr><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Phone</td><td style="padding: 10px 8px;">${phone || '—'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Event Type</td><td style="padding: 10px 8px;">${eventType || '—'}</td></tr>
            <tr><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Attendees</td><td style="padding: 10px 8px;">${attendees || '—'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Event Date</td><td style="padding: 10px 8px;">${eventDate || '—'}</td></tr>
            <tr><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Event Time</td><td style="padding: 10px 8px;">${eventTime || '—'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">How They Heard</td><td style="padding: 10px 8px;">${referral || '—'}</td></tr>
            <tr><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Message</td><td style="padding: 10px 8px;">${message.replace(/\n/g, '<br>')}</td></tr>
          </table>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
