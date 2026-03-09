// Custom Expo webpack config: ensure web output is an ES module
// This makes `import.meta` valid at runtime by loading scripts as modules.
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    // Enable module output (Webpack 5) and the experimental outputModule flag
    config.output = config.output || {};
    config.output.module = true;
    config.experiments = config.experiments || {};
    config.experiments.outputModule = true;

    // Replace any HtmlWebpackPlugin instance so scripts are injected with
    // `type="module"` (scriptLoading: 'module').
    config.plugins = (config.plugins || []).map((p) => {
        if (p && p.constructor && p.constructor.name === 'HtmlWebpackPlugin') {
            const opts = Object.assign({}, p.userOptions || p.options || {});
            opts.scriptLoading = 'module';
            return new HtmlWebpackPlugin(opts);
        }
        return p;
    });

    return config;
};
