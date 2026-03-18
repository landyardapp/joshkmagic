export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Step 1: find Place ID via phone number lookup
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=%2B15162799220&inputtype=phonenumber&fields=place_id,name&key=${env.GOOGLE_PLACES_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const placeId = searchData.candidates?.[0]?.place_id;

    if (!placeId) {
      return Response.json({ reviews: [], _debug: { search_status: searchData.status, search_error: searchData.error_message, candidates: searchData.candidates } });
    }

    // Step 2: fetch reviews using the resolved Place ID
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,name&key=${env.GOOGLE_PLACES_API_KEY}&reviews_sort=newest`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const reviews = (detailData.result?.reviews || [])
      .filter(r => r.rating === 5 && r.text && r.text.trim().length > 80)
      .map(r => ({
        author: r.author_name,
        text: r.text.trim(),
        time: r.relative_time_description,
      }));

    return Response.json({ reviews, _debug: { placeId, name: detailData.result?.name, raw_count: detailData.result?.reviews?.length ?? 0 } });
  } catch (err) {
    console.error('Reviews error:', err);
    return Response.json({ reviews: [], _debug: { error: err.message } });
  }
}
