module.exports = async (req, res) => {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || null;

  if (!sha) {
    return res.status(200).json({ build: 'local' });
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

    return res.status(200).json({ build: `Build ${sha.slice(0, 7)} · ${formatted}` });
  } catch (err) {
    return res.status(200).json({ build: `Build ${sha.slice(0, 7)}` });
  }
};
