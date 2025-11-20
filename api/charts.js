const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    // Language & pagination
    const lang = req.query.lang || "tamil";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const url =
      "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=wap6dot0";

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let data = response.data;

    // CLEAN JSON STRING (ARRAY)
    if (typeof data === "string") {
      data = data.trim();
      if (data.startsWith("(") && data.endsWith(")")) {
        data = data.slice(1, -1);
      }
      data = JSON.parse(data);
    }

    // Filter charts by language
    const filtered = data.filter(item => item.language === lang);

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    const results = filtered.slice(start, end);

    return res.status(200).json({
      success: true,
      language: lang,
      page,
      limit,
      total,
      totalPages,
      results
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
