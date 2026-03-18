import { neon } from '@neondatabase/serverless';

async function sendEmail({ to, replyTo, subject, html, apiKey, fromEmail }) {
  return fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail },
      reply_to: { email: replyTo },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, email, phone, eventType, attendees, eventDateTime, referral, message } = body;

  if (!name || !email || !message) {
    return Response.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }

  const eventDate = eventDateTime ? eventDateTime.split('T')[0] : null;
  const eventTime = eventDateTime
    ? new Date(eventDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null;

  try {
    const sql = neon(env.POSTGRES_URL);

    await sql`
      INSERT INTO submissions (name, email, phone, event_type, attendees, event_date, event_time, referral, message)
      VALUES (${name}, ${email}, ${phone || null}, ${eventType || null}, ${attendees || null}, ${eventDate}, ${eventTime}, ${referral || null}, ${message})
    `;

    const settingsRes = await sql`SELECT value FROM settings WHERE key = 'notification_email' LIMIT 1`;
    const to = settingsRes[0]?.value || env.DEFAULT_NOTIFICATION_EMAIL;

    await sendEmail({
      to,
      replyTo: email,
      subject: `New Booking Inquiry — ${name}`,
      apiKey: env.SENDGRID_API_KEY,
      fromEmail: env.SENDGRID_FROM_EMAIL,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #D4AF37; margin-bottom: 24px;">New Booking Inquiry</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 10px 8px; font-weight: bold; width: 140px; vertical-align: top;">Name</td><td style="padding: 10px 8px;">${name}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Email</td><td style="padding: 10px 8px;"><a href="mailto:${email}" style="color:#D4AF37;">${email}</a></td></tr>
            <tr><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Phone</td><td style="padding: 10px 8px;">${phone || '—'}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Event Type</td><td style="padding: 10px 8px;">${eventType || '—'}</td></tr>
            <tr><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Attendees</td><td style="padding: 10px 8px;">${attendees || '—'}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Event Date</td><td style="padding: 10px 8px;">${eventDate || '—'}</td></tr>
            <tr><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Event Time</td><td style="padding: 10px 8px;">${eventTime || '—'}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">How They Heard</td><td style="padding: 10px 8px;">${referral || '—'}</td></tr>
            <tr><td style="padding: 10px 8px; font-weight: bold; vertical-align: top;">Message</td><td style="padding: 10px 8px;">${message.replace(/\n/g, '<br>')}</td></tr>
          </table>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Contact error:', err);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
