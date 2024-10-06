const { composePlugins, withNx } = require('@nx/webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = composePlugins(withNx(), config => {
    // If you want to override the default minification you can do so like this:
    config.optimization = {
        minimize: true,
        minimizer: [new TerserPlugin()],
    };

    return config;
});
