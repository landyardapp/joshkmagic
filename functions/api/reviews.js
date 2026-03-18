export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Step 1: find Place ID via new Places API v1 text search
    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName',
      },
      body: JSON.stringify({ textQuery: 'Joshy K NY Magician Mentalist' }),
    });
    const searchText = await searchRes.text();
    const searchData = JSON.parse(searchText);
    const placeId = searchData.places?.[0]?.id;

    if (!placeId) {
      return Response.json({ reviews: [], _debug: { http_status: searchRes.status, search_response: searchData } });
    }

    // Step 2: fetch reviews using new Places API v1
    const detailRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'displayName,reviews',
      },
    });
    const detailData = await detailRes.json();

    const reviews = (detailData.reviews || [])
      .filter(r => r.rating === 5 && r.text?.text && r.text.text.trim().length > 80)
      .map(r => ({
        author: r.authorAttribution?.displayName || 'Anonymous',
        text: r.text.text.trim(),
        time: r.relativePublishTimeDescription,
      }));

    return Response.json({ reviews, _debug: { placeId, name: detailData.displayName?.text, raw_count: detailData.reviews?.length ?? 0 } });
  } catch (err) {
    console.error('Reviews error:', err);
    return Response.json({ reviews: [], _debug: { error: err.message } });
  }
}
