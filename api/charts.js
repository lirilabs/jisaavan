const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const lang = (req.query.lang || "tamil").toLowerCase();

    const url =
      "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=wap6dot0";

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let data = response.data;

    // CLEAN JSON (this endpoint returns ARRAY)
    if (typeof data === "string") {
      data = data.trim();
      if (data.startsWith("(") && data.endsWith(")")) {
        data = data.slice(1, -1);
      }
      data = JSON.parse(data);
    }

    // LANGUAGE FILTER: only include items that contain 'language'
    const filtered = data.filter(item => {
      if (!item.language) return false;  // skip if no language field
      return item.language.toLowerCase() === lang;
    });

    return res.status(200).json({
      success: true,
      language: lang,
      count: filtered.length,
      results: filtered
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
