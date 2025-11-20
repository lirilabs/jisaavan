const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const url =
      "https://www.jiosaavn.com/api.php?__call=webradio.getFeaturedStations&api_version=4&_format=json&_marker=0&ctx=wap6dot0&languages=tamil";

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    // Saavn sends weird JSON, so clean it
    let data = response.data;
    if (typeof data === "string") {
      data = data.trim();
      if (data.startsWith("(") && data.endsWith(")")) {
        data = data.slice(1, -1);
      }
      const index = data.indexOf("{");
      if (index > 0) data = data.slice(index);
      data = JSON.parse(data);
    }

    return res.status(200).json({
      success: true,
      language: "tamil",
      count: data.length,
      results: data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
