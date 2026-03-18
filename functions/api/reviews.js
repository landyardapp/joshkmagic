export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Step 1: resolve current Place ID using CID (stable identifier from Google Maps URL)
    const cidUrl = `https://maps.googleapis.com/maps/api/place/details/json?cid=16698301330846546909&fields=place_id,name&key=${env.GOOGLE_PLACES_API_KEY}`;
    const cidRes = await fetch(cidUrl);
    const cidData = await cidRes.json();
    const placeId = cidData.result?.place_id;

    if (!placeId) {
      return Response.json({ reviews: [], _debug: { cid_status: cidData.status, cid_error: cidData.error_message } });
    }

    // Step 2: fetch reviews using the resolved Place ID
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${env.GOOGLE_PLACES_API_KEY}&reviews_sort=newest`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const reviews = (detailData.result?.reviews || [])
      .filter(r => r.rating === 5 && r.text && r.text.trim().length > 80)
      .map(r => ({
        author: r.author_name,
        text: r.text.trim(),
        time: r.relative_time_description,
      }));

    return Response.json({ reviews, _debug: { placeId, raw_count: detailData.result?.reviews?.length ?? 0 } });
  } catch (err) {
    console.error('Reviews error:', err);
    return Response.json({ reviews: [], _debug: { error: err.message } });
  }
}
