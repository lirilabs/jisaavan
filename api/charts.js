const axios = require("axios");

// Clean Saavn JSON wrapper
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

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const lang = (req.query.lang || "hindi").toLowerCase();

    // Full URLs EXACTLY as you said
    const langURL = {
      hindi:   "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      english: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      telugu:  "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      bengali: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      punjabi: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      marathi: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",

      // Tamil only uses wap6dot0
      tamil:   "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=wap6dot0"
    };

    const url = langURL[lang] || langURL["hindi"];

    // Fetch RAW charts JSON
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = cleanJSON(response.data);

    // Return raw response
    return res.status(200).json({
      success: true,
      language: lang,
      raw: data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
