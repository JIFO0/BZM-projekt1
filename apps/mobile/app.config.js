/** Keeps app.json as the source of truth. Harmony web export asks for a single HTML file. */
module.exports = ({ config }) => {
  if (process.env.EXPO_HARMONY_WEB === '1') {
    return {
      ...config,
      web: {
        ...config.web,
        output: 'single',
      },
    };
  }
  return config;
};
