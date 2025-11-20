const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    // Query params
    const lang = req.query.lang || "tamil";   // language
    const page = Number(req.query.page) || 1; // page number
    const limit = Number(req.query.limit) || 20; // items per page

    const url =
      `https://www.jiosaavn.com/api.php?__call=webradio.getFeaturedStations&api_version=4&_format=json&_marker=0&ctx=wap6dot0&languages=${lang}`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // Clean malformed JSON
    let data = response.data;
    if (typeof data === "string") {
      data = data.trim();
      if (data.startsWith("(") && data.endsWith(")")) {
        data = data.slice(1, -1);
      }
      const idx = data.indexOf("{");
      if (idx > 0) data = data.slice(idx);
      data = JSON.parse(data);
    }

    // Pagination logic
    const total = data.length;
    const totalPages = Math.ceil(total / limit);

    const start = (page - 1) * limit;
    const end = start + limit;

    const results = data.slice(start, end);

    return res.status(200).json({
      success: true,
      language: lang,
      total,
      page,
      limit,
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

