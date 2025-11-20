const axios = require("axios");

// -----------------------------
// In-Memory Cache (persists per Vercel container)
// -----------------------------
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCacheKey(lang, page, limit) {
  return `${lang}_${page}_${limit}`;
}

function setCache(key, data) {
  cache.set(key, {
    timestamp: Date.now(),
    data
  });
}

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

// -----------------------------
// SAFE JSON PARSER
// -----------------------------
function safeParse(data) {
  if (typeof data === "string") {
    const cleaned = data.trim().replace(/^\(|\)$/g, "");
    return JSON.parse(cleaned);
  }
  return data;
}

// -----------------------------
// Fetch Single Language Page
// -----------------------------
async function fetchLanguage(lang, page, limit) {
  const cacheKey = getCacheKey(lang, page, limit);
  const fromCache = getCache(cacheKey);
  if (fromCache) return fromCache;

  const url = `https://www.jiosaavn.com/api.php?__call=content.getAlbums&api_version=4&_format=json&_marker=0&n=${limit}&p=${page}&ctx=wap6dot0&languages=${lang}`;

  const { data } = await axios.get(url, {
    timeout: 8000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const json = safeParse(data);

  const list = json.data.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    type: item.type,
    url: item.perma_url,
    image: item.image,
    language: item.language,
    year: item.year,
    play_count: item.play_count,
    album: item.more_info?.album,
    duration: item.more_info?.duration,
    artists: item.more_info?.artistMap?.primary_artists?.map(a => a.name) || []
  }));

  // store in cache
  setCache(cacheKey, list);

  return list;
}

// -----------------------------
// MAIN SERVERLESS HANDLER
// -----------------------------
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    let lang = req.query.lang || "tamil";    // can be single or "tamil,hindi,malayalam"
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.n) || 50;

    const languages = lang.split(",").map(l => l.trim().toLowerCase());

    // Parallel fetching for all languages
    const results = await Promise.all(
      languages.map(l => fetchLanguage(l, page, limit))
    );

    // Map results by language
    const response = {};
    languages.forEach((l, i) => {
      response[l] = results[i];
    });

    return res.status(200).json({
      success: true,
      page,
      languages,
      results: response
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
