const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const url =
      "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0";

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let data = response.data;

    // CLEAN JSON (raw array)
    if (typeof data === "string") {
      data = data.trim();
      if (data.startsWith("(") && data.endsWith(")")) {
        data = data.slice(1, -1);
      }
      data = JSON.parse(data);
    }

    // Pretty formatted output
    return res.status(200).send(JSON.stringify({
      success: true,
      total: data.length,
      results: data
    }, null, 2)); // <-- PRETTY JSON (indentation)

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

