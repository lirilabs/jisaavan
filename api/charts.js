const axios = require("axios");

// Clean Saavn wrapped JSON
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
function getToken(perma_url) {
  return perma_url.split("/").pop();
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const lang = (req.query.lang || "hindi").toLowerCase();

    // Full URLs EXACTLY as you provided
    const langURL = {
      hindi:   "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      english: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      telugu:  "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      bengali: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      punjabi: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      marathi: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",

      // Tamil only
      tamil:   "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=wap6dot0"
    };

    // 1. Fetch raw charts
    const raw = await axios.get(langURL[lang], {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const charts = cleanJSON(raw.data);

    // 2. For each chart → fetch playlist details
    const enrichedCharts = await Promise.all(
      charts.map(async chart => {
        const token = getToken(chart.perma_url);

        const detailURL =
          `https://www.jiosaavn.com/api.php?__call=webapi.get` +
          `&token=${encodeURIComponent(token)}` +
          `&type=playlist&p=1&n=200&includeMetaTags=0` +
          `&ctx=wap6dot0&api_version=4&_format=json&_marker=0`;

        try {
          const detailRaw = await axios.get(detailURL, {
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          const detail = cleanJSON(detailRaw.data);

          const songIDs = detail?.list?.map(song => song.id) || [];

          return {
            ...chart,
            songs: songIDs
          };
        } catch (e) {
          return {
            ...chart,
            songs: []
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      language: lang,
      count: enrichedCharts.length,
      results: enrichedCharts
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
