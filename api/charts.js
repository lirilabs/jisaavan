const axios = require("axios");

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

function getToken(url) {
  return url.split("/").pop();
}

async function getSongURL(enc, bitrate = 128) {
  try {
    const api =
      `https://www.jiosaavn.com/api.php?__call=song.generateAuthToken` +
      `&url=${encodeURIComponent(enc)}` +
      `&bitrate=${bitrate}` +
      `&api_version=4&_format=json&_marker=0&ctx=wap6dot0`;

    const res = await axios.get(api, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = cleanJSON(res.data);

    return data.auth_url || null;
  } catch {
    return null;
  }
}

async function buildSongObject(song) {
  const enc = song.more_info?.encrypted_media_url;
  const artist =
    song.more_info?.artistMap?.primary_artists?.[0]?.name ||
    song.subtitle?.split("-")?.[0]?.trim() ||
    "";

  let url128 = null;
  let url320 = null;

  if (enc) {
    url128 = await getSongURL(enc, 128);
    url320 = await getSongURL(enc, 320);
  }

  return {
    id: song.id,
    title: song.title,
    image: song.image,
    artist: artist,
    album: song.more_info?.album || "",
    mp3_128: url128,
    mp3_320: url320,
    m4a: url128 ? url128.replace(".mp4", ".m4a") : null
  };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const lang = (req.query.lang || "hindi").toLowerCase();

    const langURL = {
      hindi:   "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      english: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      telugu:  "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      bengali: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      punjabi: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",
      marathi: "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0",

      tamil:   "https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=wap6dot0"
    };

    const chartsRes = await axios.get(langURL[lang], {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const charts = cleanJSON(chartsRes.data);

    const results = await Promise.all(
      charts.map(async chart => {
        const token = getToken(chart.perma_url);

        const detailURL =
          `https://www.jiosaavn.com/api.php?__call=webapi.get` +
          `&token=${encodeURIComponent(token)}` +
          `&type=playlist&p=1&n=200&includeMetaTags=0` +
          `&ctx=wap6dot0&api_version=4&_format=json&_marker=0`;

        let detailData;

        try {
          const detailRes = await axios.get(detailURL, {
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          detailData = cleanJSON(detailRes.data);
        } catch {
          detailData = { list: [] };
        }

        const songs = await Promise.all(
          (detailData.list || []).map(song => buildSongObject(song))
        );

        return {
          id: chart.id,
          title: chart.title,
          image: chart.image,
          perma_url: chart.perma_url,
          songs
        };
      })
    );

    return res.status(200).json({
      success: true,
      language: lang,
      count: results.length,
      results
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
