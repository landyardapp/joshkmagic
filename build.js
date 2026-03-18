const fs = require('fs');

const sha = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);
const now = new Date();
const formatted = now.toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
  hour: 'numeric', minute: '2-digit', hour12: true,
  timeZone: 'America/New_York'
}) + ' ET';

const buildInfo = `Build ${sha} &middot; ${formatted}`;

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('<!--BUILD_INFO-->', buildInfo);
fs.writeFileSync('index.html', html);

console.log('Injected build info:', `Build ${sha} · ${formatted}`);
