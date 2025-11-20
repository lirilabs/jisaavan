const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const lang = req.query.lang || "tamil";  // language
    const page = req.query.page || 1;        // pagination
    const limit = req.query.n || 50;         // count

    const url = `https://www.jiosaavn.com/api.php?__call=content.getAlbums&api_version=4&_format=json&_marker=0&n=${limit}&p=${page}&ctx=wap6dot0&languages=${lang}`;

    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // SAFELY PARSE THE RESPONSE
    let json;
    if (typeof data === "string") {
      // JioSaavn wraps JSON → remove extra characters
      const cleaned = data.trim().replace(/^\(|\)$/g, "");
      json = JSON.parse(cleaned);
    } else {
      json = data; // already JSON
    }

    const list = json.data.map(item => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      type: item.type,
      url: item.perma_url,
      image: item.image,
      language: item.language,
      year: item.year,
      play_count: item.play_count,
      album: item.more_info?.album,
      duration: item.more_info?.duration,
      artists: item.more_info?.artistMap?.primary_artists?.map(a => a.name) || []
    }));

    return res.status(200).json({
      success: true,
      page: Number(page),
      language: lang,
      count: list.length,
      results: list
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
