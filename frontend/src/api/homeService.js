import { http } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'homeService');

async function fetchCounts() {
  try {
    // Fetch questions count from questions table (published questions)
    // Fetch contents counts by type_id using the content_types slug
    const [qRes, contentsRes] = await Promise.all([
      http.get('/v1/questions/count', { _public: true }),
      http.get('/v1/contents/counts', { _public: true }),
    ]);

    // Extract questions total from response
    const qTotal = qRes?.data?.data?.total ?? null;
    
    // Backend returns a map of { type_slug: count }
    // Based on migration 2025_11_02_062503: ID 1=sample, ID 2=booklet, ID 3=video, ID 4=experiment
    const byType = contentsRes?.data?.data ?? {};

    // console.log('Raw counts from API:', { qTotal, byType });

    // Direct access to content type counts by their exact slugs
    const videos = byType['video'] ?? byType['videos'] ?? null;
    const handouts = byType['booklet'] ?? byType['handout'] ?? null;
    const samples = byType['sample'] ?? byType['samples'] ?? null;

    return {
      questions: typeof qTotal === 'number' ? qTotal : null,
      handouts: typeof handouts === 'number' ? handouts : null,
      videos: typeof videos === 'number' ? videos : null,
      samples: typeof samples === 'number' ? samples : null,
    };
  } catch (err) {
    console.error('Failed to fetch counts:', err);
    return { questions: null, handouts: null, videos: null, samples: null };
  }
}

async function fetchArchiveCards() {
  try {
    const res = await http.get('/v1/blog-posts', { params: { per_page: 6 }, _public: true, withCredentials: false });
    const items = Array.isArray(res?.data?.data) ? res.data.data : [];
    // Backend returns id,title,slug,url,date; map to ArchiveSection card shape
    const cards = items.map(p => ({
      id: p.slug || String(p.id),
      slug: p.slug,
      title: p.title,
      img: p.cover_image_url || p.image || null, // Don't use placeholder, just null if no cover
      comments: 0,
      likes: 0,
      url: p.url || (p.slug ? `/blog/${p.slug}` : null),
      category: 'latest', // Default category
    }));
    
    // Return all filter options, not just 'latest'
    const filters = [
      { key: 'latest', label: 'جدیدترین' },
      { key: 'hot', label: 'داغ' },
      { key: 'grade_7', label: 'هفتم' },
      { key: 'grade_8', label: 'هشتم' },
      { key: 'grade_9', label: 'نهم' },
    ];
    
    return { filters, cards, allUrl: '/blogs' };
  } catch (err) {
    console.error('Failed to fetch blog posts:', err);
    return { 
      filters: [
        { key: 'latest', label: 'جدیدترین' },
        { key: 'hot', label: 'داغ' },
        { key: 'grade_7', label: 'هفتم' },
        { key: 'grade_8', label: 'هشتم' },
        { key: 'grade_9', label: 'نهم' },
      ], 
      cards: [], 
      allUrl: '/blogs' 
    };
  }
}

// New function to fetch archive cards progressively
async function fetchArchiveCardsProgressively(onCardLoaded) {
  try {
    const res = await http.get('/v1/blog-posts', { params: { per_page: 6 }, _public: true, withCredentials: false });
    const items = Array.isArray(res?.data?.data) ? res.data.data : [];
    
    // Process each blog post individually
    const cardPromises = items.map(async (p, index) => {
      // Simulate individual loading by adding small delay
      await new Promise(resolve => setTimeout(resolve, index * 100));
      
      const card = {
        id: p.slug || String(p.id),
        slug: p.slug,
        title: p.title,
        img: p.cover_image_url || p.image || null, // Don't use placeholder, just null if no cover
        comments: 0,
        likes: 0,
        url: p.url || (p.slug ? `/blog/${p.slug}` : null),
        category: 'latest',
      };
      
      // Call the callback with the loaded card
      if (onCardLoaded) {
        onCardLoaded(card, index);
      }
      
      return card;
    });
    
    // Wait for all cards to load
    const cards = await Promise.all(cardPromises);
    
    const filters = [
      { key: 'latest', label: 'جدیدترین' },
      { key: 'hot', label: 'داغ' },
      { key: 'grade_7', label: 'هفتم' },
      { key: 'grade_8', label: 'هشتم' },
      { key: 'grade_9', label: 'نهم' },
    ];
    
    return { filters, cards, allUrl: '/blogs' };
  } catch (err) {
    console.error('Failed to fetch blog posts:', err);
    return { 
      filters: [
        { key: 'latest', label: 'جدیدترین' },
        { key: 'hot', label: 'داغ' },
        { key: 'grade_7', label: 'هفتم' },
        { key: 'grade_8', label: 'هشتم' },
        { key: 'grade_9', label: 'نهم' },
      ], 
      cards: [], 
      allUrl: '/blogs' 
    };
  }
}

async function fetchHomeDataOnly() {
  try {
    const home = await http.get('/v1/home').then(r => r?.data).catch(() => null);
    const body = home?.data || {};
    
    // Map grades to UI-friendly shape, keeping fallbacks
    const grades = Array.isArray(body?.body?.grades)
      ? body.body.grades.map((g, idx) => ({
          name: g?.name || `پایه ${idx + 1}`,
          subject: 'علوم تجربی',
          grade: g?.id ?? (idx + 7),
          bgImage: `/images/${(idx + 7)}th-grade.png`,
        }))
      : null;

    return { grades };
  } catch (err) {
    console.error('Failed to fetch home data:', err);
    return { grades: null };
  }
}

export async function fetchHomeData() {
  // Fetch home block and counts in parallel for better TTI
  const [home, counts, archive] = await Promise.all([
    http.get('/v1/home').then(r => r?.data).catch(() => null),
    fetchCounts(),
    fetchArchiveCards(),
  ]);

  const body = home?.data || {};
  const header = home?.data ? home?.data?.header : null;
  const account = header?.account || {};
  const isAuth = !!account?.is_authenticated;
  const user = isAuth ? (account?.user || null) : null;

  // Map grades to UI-friendly shape, keeping fallbacks
  const grades = Array.isArray(body?.body?.grades)
    ? body.body.grades.map((g, idx) => ({
        name: g?.name || `پایه ${idx + 1}`,
        subject: 'علوم تجربی',
        grade: g?.id ?? (idx + 7),
        bgImage: `/images/${(idx + 7)}th-grade.png`,
      }))
    : null;

  // Map blog section - use ONLY data from fetchArchiveCards (real DB data)
  const filters = archive?.filters || [];
  const cards = archive?.cards || [];

  return {
    user,
    grades,
    archive: { filters, cards, allUrl: archive?.allUrl || '/blog' },
    counts,
  };
}

export default { 
  fetchHomeData, 
  fetchCounts, 
  fetchArchiveCards,
  fetchArchiveCardsProgressively,
  fetchHomeDataOnly 
};
