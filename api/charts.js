const axios = require("axios");

// Clean JioSaavn weird response
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

// Extract token from perma_url
function extractToken(url) {
  return url.split("/").pop();
}

// Extract artist name (priority order)
function extractArtist(meta, detail) {
  // 1. Playlist header artists → "Artists On Cover: X"
  if (detail.header_desc) {
    const match = detail.header_desc.match(/Artists On Cover:\s*([^,\n]+)/i);
    if (match) return match[1].trim();
  }

  // 2. Primary artists in detail
  const primary = detail?.list?.[0]?.more_info?.artistMap?.primary_artists;
  if (Array.isArray(primary) && primary.length > 0) {
    return primary[0].name;
  }

  // 3. Subtitle in chartMeta
  if (meta.subtitle) {
    return meta.subtitle;
  }

  return "";
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const lang = req.query.lang || "hindi";

    // 1. Fetch charts (web6dot0 gives the correct list)
    const chartsResp = await axios.get(
      "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    const charts = cleanJSON(chartsResp.data).filter(
      (item) => item.language === lang
    );

    // 2. Fetch details for each chart
    const detailed = await Promise.all(
      charts.map(async (chart) => {
        const token = extractToken(chart.perma_url);

        const detailResp = await axios.get(
          `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${encodeURIComponent(
            token
          )}&type=playlist&p=1&n=200&includeMetaTags=0&ctx=wap6dot0&api_version=4&_format=json&_marker=0`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        );

        const detail = cleanJSON(detailResp.data);

        const artistName = extractArtist(chart, detail);

        const songIDs =
          detail.list?.map((song) => song.id).filter(Boolean) || [];

        return {
          id: chart.id,
          title: chart.title,
          image: chart.image,
          artist: artistName,
          songs: songIDs,
        };
      })
    );

    return res.status(200).json({
      success: true,
      language: lang,
      count: detailed.length,
      results: detailed,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
