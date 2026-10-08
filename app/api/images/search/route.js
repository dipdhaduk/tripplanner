import { fail, ok } from '@/lib/http';

const CURATED_DESTINATIONS = [
  { match: ['jaipur', 'pink city', 'rajasthan'], url: 'https://images.unsplash.com/photo-1578999935853-4ec5fa6c1f60?auto=format&fit=crop&w=1200&q=80', photographer: 'Bhavya Shah', photoUrl: 'https://unsplash.com' },
  { match: ['kerala', 'alleppey', 'kochi', 'cochin', 'munnar', 'wayanad', 'backwaters'], url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80', photographer: 'Kyran Low', photoUrl: 'https://unsplash.com' },
  { match: ['varanasi', 'banaras', 'kashi', 'ganga', 'ghat'], url: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1200&q=80', photographer: 'Karan Kumar', photoUrl: 'https://unsplash.com' },
  { match: ['ladakh', 'leh', 'pangong', 'nubra', 'zanskar'], url: 'https://images.unsplash.com/photo-1584542017899-d8aa29272a27?auto=format&fit=crop&w=1200&q=80', photographer: 'Sanjeev Kumar', photoUrl: 'https://unsplash.com' },
  { match: ['goa', 'calangute', 'anjuna', 'panaji', 'baga'], url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', photographer: 'Alexey Turenkov', photoUrl: 'https://unsplash.com' },
  { match: ['agra', 'taj mahal'], url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80', photographer: 'Sylwia Bartyzel', photoUrl: 'https://unsplash.com' },
  { match: ['udaipur', 'lake pichola', 'city palace', 'fateh sagar'], url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80', photographer: 'Yashodhan Chari', photoUrl: 'https://unsplash.com' },
  { match: ['manali', 'himachal', 'kasol', 'shimla', 'spiti', 'dharamshala', 'kullu'], url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80', photographer: 'Prakhar Amrit', photoUrl: 'https://unsplash.com' },
  { match: ['rishikesh', 'haridwar', 'uttarakhand', 'dehradun', 'mussoorie'], url: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=1200&q=80', photographer: 'Akshay Syal', photoUrl: 'https://unsplash.com' },
  { match: ['mumbai', 'bombay'], url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80', photographer: 'Aditya Chache', photoUrl: 'https://unsplash.com' },
  { match: ['delhi', 'new delhi'], url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80', photographer: 'Faris Mohammed', photoUrl: 'https://unsplash.com' },
  { match: ['bengaluru', 'bangalore', 'mysore', 'mysuru'], url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80', photographer: 'Naveen Kumar', photoUrl: 'https://unsplash.com' },
  { match: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam'], url: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80', photographer: 'Imad Clicks', photoUrl: 'https://unsplash.com' },
  { match: ['amritsar', 'golden temple', 'punjab'], url: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=80', photographer: 'Sanket Arora', photoUrl: 'https://unsplash.com' },
  { match: ['darjeeling', 'sikkim', 'gangtok', 'kalimpong'], url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80', photographer: 'Partha Narasimhan', photoUrl: 'https://unsplash.com' },
  { match: ['hampi', 'karnataka', 'badami'], url: 'https://images.unsplash.com/photo-1600100397608-f010f4439c2c?auto=format&fit=crop&w=1200&q=80', photographer: 'Arijit Roy', photoUrl: 'https://unsplash.com' },
  { match: ['pondicherry', 'puducherry'], url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80', photographer: 'Sarath P', photoUrl: 'https://unsplash.com' },
  { match: ['beach', 'sea', 'coast', 'ocean', 'island', 'andaman'], url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', photographer: 'Sean Oulashin', photoUrl: 'https://unsplash.com' },
  { match: ['mountain', 'himalaya', 'hill', 'trek', 'snow', 'peak'], url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', photographer: 'Kalvis Svilans', photoUrl: 'https://unsplash.com' },
  { match: ['palace', 'fort', 'heritage', 'monument', 'temple'], url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80', photographer: 'Jitendra Rathore', photoUrl: 'https://unsplash.com' },
];

const DEFAULT_FALLBACK_PHOTO = {
  url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
  alt: 'Travel across incredible India',
  photographer: 'Sylwia Bartyzel',
  photographerUrl: 'https://unsplash.com',
  photoUrl: 'https://unsplash.com',
  source: 'Curated',
};

function getCuratedPhoto(query) {
  const q = String(query || '').toLowerCase().trim();
  for (const item of CURATED_DESTINATIONS) {
    if (item.match.some((m) => q.includes(m) || m.includes(q))) {
      return {
        url: item.url,
        alt: `Travel destination: ${query}`,
        photographer: item.photographer,
        photographerUrl: item.photoUrl,
        photoUrl: item.photoUrl,
        source: 'Curated',
      };
    }
  }
  return { ...DEFAULT_FALLBACK_PHOTO, alt: `Travel journey: ${query}` };
}

function isValidKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 8) return false;
  if (/^(your_actual|your_secret|placeholder|my_key|your_key)/i.test(trimmed)) return false;
  return true;
}

export async function GET(request) {
  const query = new URL(request.url).searchParams.get('query')?.trim();
  if (!query || query.length < 2 || query.length > 120) {
    return fail('Enter a destination or trip title between 2 and 120 characters.');
  }

  const unsplashKey = (process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '').trim();
  const pixabayKey = (process.env.PIXABAY_API_KEY || process.env.NEXT_PUBLIC_PIXABAY_API_KEY || '').trim();

  // 1. Try Unsplash if a valid key is provided
  if (isValidKey(unsplashKey)) {
    try {
      const endpoint = new URL('https://api.unsplash.com/search/photos');
      endpoint.searchParams.set('query', `${query} travel`);
      endpoint.searchParams.set('orientation', 'landscape');
      endpoint.searchParams.set('per_page', '1');
      endpoint.searchParams.set('content_filter', 'high');

      const response = await fetch(endpoint, {
        headers: { Authorization: `Client-ID ${unsplashKey}`, 'Accept-Version': 'v1' },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 86400 },
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.results?.[0];
        if (result?.urls?.regular && result.links?.html && result.user?.links?.html) {
          const tracking = 'utm_source=tripplanner&utm_medium=referral';
          const photoPage = new URL(result.links.html);
          photoPage.search = tracking;
          const photographerPage = new URL(result.user.links.html);
          photographerPage.search = tracking;

          const res = ok({
            image: {
              url: result.urls.regular,
              alt: result.alt_description || result.description || `Travel destination: ${query}`,
              photographer: result.user.name,
              photographerUrl: photographerPage.toString(),
              photoUrl: photoPage.toString(),
              source: 'Unsplash',
            },
          });
          res.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
          return res;
        }
      }
    } catch {
      // Continue to next provider or curated fallback
    }
  }

  // 2. Try Pixabay if a valid Pixabay key is provided
  if (isValidKey(pixabayKey)) {
    try {
      const endpoint = new URL('https://pixabay.com/api/');
      endpoint.searchParams.set('key', pixabayKey);
      endpoint.searchParams.set('q', `${query} travel`);
      endpoint.searchParams.set('image_type', 'photo');
      endpoint.searchParams.set('orientation', 'horizontal');
      endpoint.searchParams.set('safesearch', 'true');
      endpoint.searchParams.set('per_page', '3');

      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 86400 },
      });

      if (response.ok) {
        const data = await response.json();
        const hit = data.hits?.[0];
        if (hit?.webformatURL || hit?.largeImageURL) {
          const res = ok({
            image: {
              url: hit.largeImageURL || hit.webformatURL,
              alt: `${query} travel destination`,
              photographer: hit.user || 'Pixabay Creator',
              photographerUrl: hit.pageURL,
              photoUrl: hit.pageURL,
              source: 'Pixabay',
            },
          });
          res.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
          return res;
        }
      }
    } catch {
      // Continue to curated fallback
    }
  }

  // 3. Fallback: Curated high-resolution imagery
  const fallback = getCuratedPhoto(query);
  const fallbackRes = ok({ image: fallback });
  fallbackRes.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  return fallbackRes;
}
