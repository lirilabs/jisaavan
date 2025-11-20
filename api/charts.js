const axios = require('axios');

async function fetchCharts(lang = 'hindi') {
  const chartsUrl = `https://www.jiosaavn.com/api.php?__call=content.getCharts&api_version=4&_format=json&_marker=0&ctx=web6dot0`;
  const resp = await axios.get(chartsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  let data = resp.data;
  if (typeof data === 'string') {
    data = data.trim();
    if (data.startsWith('(') && data.endsWith(')')) {
      data = data.slice(1, -1);
    }
    data = JSON.parse(data);
  }
  // filter by language
  const charts = data.filter(item => item.language && item.language.toLowerCase() === lang.toLowerCase());
  return charts;
}

function extractTokenFromUrl(permaUrl) {
  const segments = permaUrl.split('/');
  return segments.pop();
}

async function fetchPlaylistDetails(token, page = 1, n = 50) {
  const playlistUrl = `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${encodeURIComponent(token)}&type=playlist&p=${page}&n=${n}&includeMetaTags=0&ctx=wap6dot0&api_version=4&_format=json&_marker=0`;
  const resp = await axios.get(playlistUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  let data = resp.data;
  if (typeof data === 'string') {
    data = data.trim();
    if (data.startsWith('(') && data.endsWith(')')) {
      data = data.slice(1, -1);
    }
    data = JSON.parse(data);
  }
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const lang = req.query.lang || 'hindi';

    const charts = await fetchCharts(lang);
    // For each chart, fetch playlist details in parallel
    const detailedPromises = charts.map(async (chartItem) => {
      const token = extractTokenFromUrl(chartItem.perma_url);
      const playlistDetail = await fetchPlaylistDetails(token);
      return {
        chartMeta: chartItem,
        playlistDetail
      };
    });

    const detailedCharts = await Promise.all(detailedPromises);

    return res.status(200).json({
      success: true,
      language: lang,
      count: detailedCharts.length,
      results: detailedCharts
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
