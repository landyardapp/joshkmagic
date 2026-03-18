export async function onRequestGet(context) {
  const { env } = context;
  const sha = env.CF_PAGES_COMMIT_SHA || null;

  if (!sha) {
    return Response.json({ build: 'local' });
  }

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/landyardapp/joshkmagic/commits/${sha}`,
      { headers: { 'User-Agent': 'joshkmagic-site' } }
    );
    const data = await ghRes.json();
    const date = new Date(data.commit.committer.date);
    const formatted = date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'America/New_York'
    }) + ' ET';

    return Response.json({ build: `Build ${sha.slice(0, 7)} · ${formatted}` });
  } catch {
    return Response.json({ build: `Build ${sha.slice(0, 7)}` });
  }
}
