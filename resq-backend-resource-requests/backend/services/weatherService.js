const mockData = require('../data/mockData');

/**
 * Weather Service with Open-Meteo integration & robust fallback
 */
async function fetchCurrentWeather(lat = 12.9716, lon = 77.5946) {
  const currentMock = mockData.getWeather();
  const weatherApiUrl = process.env.WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast';

  try {
    const response = await fetch(`${weatherApiUrl}?latitude=${lat}&longitude=${lon}&current_weather=true`, {
      signal: AbortSignal.timeout(3000) // 3s timeout
    });

    if (!response.ok) {
      return currentMock;
    }

    const data = await response.json();
    const cw = data.current_weather;

    if (!cw) {
      return currentMock;
    }

    const temp = Math.round(cw.temperature);
    const wind = Math.round(cw.windspeed);
    const code = cw.weathercode;

    // Infer rainfall & risk level from weather code or wind
    let conditions = 'Partly Cloudy';
    let rainfall = 0;
    let riskLevel = 'LOW';

    if (code >= 51 && code <= 67) {
      conditions = 'Light to Heavy Rain';
      rainfall = 25;
      riskLevel = 'MODERATE';
    } else if (code >= 80 && code <= 99) {
      conditions = 'Severe Thunderstorm & Flooding';
      rainfall = 65;
      riskLevel = 'HIGH';
    }

    const liveWeather = {
      temperature: temp,
      rainfall,
      windSpeed: wind,
      precipitationProbability: code > 50 ? 80 : 20,
      conditions,
      riskLevel
    };

    // Update in-memory state with live parameters
    mockData.setWeather({ ...currentMock, ...liveWeather });
    return liveWeather;
  } catch (err) {
    console.warn('[Weather Service] External API call failed or timed out. Serving fallback weather:', err.message);
    return currentMock;
  }
}

module.exports = {
  fetchCurrentWeather
};
