const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const lang = req.query.lang || "tamil";

    // STEP 1: Get radio stations for the language
    const radioURL =
      `https://www.jiosaavn.com/api.php?__call=webradio.getFeaturedStations&api_version=4&_format=json&_marker=0&ctx=wap6dot0&languages=${lang}`;

    const radioRes = await axios.get(radioURL, { headers: { "User-Agent": "Mozilla/5.0" } });

    let radioData = radioRes.data;
    if (typeof radioData === "string") {
      radioData = radioData.trim();
      if (radioData.startsWith("(")) radioData = radioData.slice(1);
      if (radioData.endsWith(")")) radioData = radioData.slice(0, -1);
      radioData = JSON.parse(radioData);
    }

    // Take first radio only for now
    const firstStation = radioData[0];
    if (!firstStation) {
      return res.json({ success: false, error: "No radio stations found" });
    }

    // STEP 2: Start radio and get first song
    const stationName = encodeURIComponent(firstStation.title);
    const createStationURL =
      `https://www.jiosaavn.com/api.php?__call=webradio.createStation&stationName=${stationName}&type=featured&language=${lang}&api_version=4&_format=json&_marker=0&ctx=web6dot0`;

    const createRes = await axios.get(createStationURL, { headers: { "User-Agent": "Mozilla/5.0" } });

    let stationData = createRes.data;
    if (typeof stationData === "string") {
      stationData = stationData.trim();
      if (stationData.startsWith("(")) stationData = stationData.slice(1);
      if (stationData.endsWith(")")) stationData = stationData.slice(0, -1);
      stationData = JSON.parse(stationData);
    }

    const songs = stationData?.list || [];
    if (songs.length === 0) {
      return res.json({ success: false, error: "Radio has no songs" });
    }

    const firstSong = songs[0];
    const encryptedURL = firstSong.more_info?.encrypted_media_url;

    if (!encryptedURL) {
      return res.json({ success: false, error: "Song missing encrypted_media_url" });
    }

    // STEP 3: Generate MP3 URL using encrypted_media_url
    const authURL =
      `https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&url=${encodeURIComponent(
        encryptedURL
      )}&bitrate=128&api_version=4&_format=json&ctx=web6dot0&_marker=0`;

    const authRes = await axios.get(authURL, { headers: { "User-Agent": "Mozilla/5.0" } });

    let authData = authRes.data;
    if (typeof authData === "string") {
      authData = authData.trim();
      if (authData.startsWith("(")) authData = authData.slice(1);
      if (authData.endsWith(")")) authData = authData.slice(0, -1);
      authData = JSON.parse(authData);
    }

    // Final song data
    const result = {
      station: firstStation.title,
      song: {
        id: firstSong.id,
        title: firstSong.title,
        image: firstSong.image,
        artist: firstSong.more_info?.artistMap?.primary_artists?.[0]?.name || "",
        album: firstSong.more_info?.album || "",
        mp3_128: authData.auth_url || null,
        type: authData.type || "mp4"
      }
    };

    return res.status(200).json({
      success: true,
      language: lang,
      result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
