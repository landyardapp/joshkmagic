export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Step 1: find the place using new Places API v1 text search
    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName',
      },
      body: JSON.stringify({ textQuery: 'Joshy K NY Magician Mentalist New York' }),
    });
    const searchData = await searchRes.json();
    const placeId = searchData.places?.[0]?.id;

    if (!placeId) {
      return Response.json({ reviews: [], _debug: { search: searchData } });
    }

    // Step 2: fetch reviews for that place
    const detailRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'reviews,displayName',
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

    return Response.json({ reviews, _debug: { placeId, displayName: detailData.displayName, raw_count: detailData.reviews?.length ?? 0 } });
  } catch (err) {
    console.error('Reviews error:', err);
    return Response.json({ reviews: [], _debug: { error: err.message } });
  }
}
