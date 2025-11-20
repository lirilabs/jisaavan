const axios = require("axios");

// Clean JioSaavn JSON wrapper
function cleanJSON(input) {
  if (typeof input === "string") {
    let data = input.trim();
    if (data.startsWith("(") && data.endsWith(")")) {
      data = data.slice(1, -1);
    }
    const idx = data.indexOf("{");
    if (idx > 0) data = data.slice(idx);
    return JSON.parse(data);
  }
  return input;
}

// Extract playlist token from perma_url
function extractToken(url) {
  return url.split("/").pop();
}

// Extract best possible artist
function extractArtist(meta, detail) {
  // Artists On Cover
  if (detail.header_desc) {
    const match = detail.header_desc.match(/Artists On Cover:\s*([^,\n]+)/i);
    if (match) return match[1].trim();
  }

  // Primary artist of first song
  const primary = detail?.list?.[0]?.more_info?.artistMap?.primary_artists;
  if (primary?.length > 0) {
    return primary[0].name;
  }

  // Fallback to subtitle
  return meta.subtitle || "";
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    // Get language input
    const lang = (req.query.lang || "hindi").toLowerCase();

    // FULL URL mapping EXACTLY as you provided
    const langURL = {
      hindi:   "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      english: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      telugu:  "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      bengali: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      punjabi: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      marathi: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",

      // Tamil = ONLY one using wap6dot0
      tamil:   "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=wap6dot0"
    };

    const chartsURL = langURL[lang] || langURL["hindi"];

    // 1. Fetch charts
    const rawCharts = await axios.get(chartsURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let charts = cleanJSON(rawCharts.data);

    // Filter charts for selected language
    charts = charts.filter(item => item.language === lang);

    // 2. Fetch playlist details (runs in parallel)
    const finalOutput = await Promise.all(
      charts.map(async (chart) => {
        const token = extractToken(chart.perma_url);

        const detailURL =
          `https://www.jiosaavn.com/api.php?__call=webapi.get&` +
          `token=${encodeURIComponent(token)}&type=playlist&p=1&n=200` +
          `&includeMetaTags=0&ctx=wap6dot0&api_version=4&_format=json&_marker=0`;

        const detailRaw = await axios.get(detailURL, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        const detail = cleanJSON(detailRaw.data);
        const artistName = extractArtist(chart, detail);
        const songIDs = detail?.list?.map(s => s.id) || [];

        return {
          id: chart.id,
          title: chart.title,
          image: chart.image,
          artist: artistName,
          songs: songIDs
        };
      })
    );

    return res.status(200).json({
      success: true,
      language: lang,
      count: finalOutput.length,
      results: finalOutput
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
