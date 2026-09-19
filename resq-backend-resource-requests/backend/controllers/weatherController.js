const { fetchCurrentWeather } = require('../services/weatherService');
const mockData = require('../data/mockData');

const getWeather = async (req, res) => {
  try {
    const weather = await fetchCurrentWeather();
    res.status(200).json(weather);
  } catch (err) {
    res.status(200).json(mockData.getWeather());
  }
};

module.exports = {
  getWeather
};
