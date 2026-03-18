export async function onRequestGet(context) {
  const { env } = context;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${env.GOOGLE_PLACE_ID}&fields=reviews&key=${env.GOOGLE_PLACES_API_KEY}&reviews_sort=newest`;
    const res = await fetch(url);
    const data = await res.json();

    const reviews = (data.result?.reviews || [])
      .filter(r => r.rating === 5 && r.text && r.text.trim().length > 80)
      .map(r => ({
        author: r.author_name,
        text: r.text.trim(),
        time: r.relative_time_description,
      }));

    return Response.json({ reviews });
  } catch (err) {
    console.error('Reviews error:', err);
    return Response.json({ reviews: [] });
  }
}
