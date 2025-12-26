// Loads .env files into process.env when running Expo config
require('dotenv').config();

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    WEATHER_API_KEY: process.env.WEATHER_API_KEY || null,
  },
});
