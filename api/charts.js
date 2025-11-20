const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const url =
      "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=wap6dot0";

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    let data = response.data;

    // Safe JSON parse (JioSaavn returns ( ... ))
    if (typeof data === "string") {
      data = data.trim();
      if (data.startsWith("(") && data.endsWith(")")) {
        data = data.slice(1, -1);
      }
      const idx = data.indexOf("{");
      if (idx > 0) data = data.slice(idx);
      data = JSON.parse(data);
    }

    // Filter for ONLY Tamil charts
    const tamilCharts = data.filter(item => item.language === "tamil");

    return res.status(200).json({
      success: true,
      language: "tamil",
      count: tamilCharts.length,
      results: tamilCharts
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
