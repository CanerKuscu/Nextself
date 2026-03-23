module.exports = function (api) {
    api && api.cache && api.cache(true);

    // Use Expo's preset when available, fallback to a sensible default.
    const presets = [];
    try {
        presets.push([require.resolve('babel-preset-expo'), { unstable_transformImportMeta: true }]);
    } catch (e) {
    }

    const plugins = [];
    try {
        plugins.push(require.resolve('react-native-worklets-core/plugin'));
    } catch (e) {
    }

    return {
        presets,
        plugins: [
            function replaceImportMeta() {
                return {
                    visitor: {
                        MetaProperty(path) {
                            if (
                                path.node.meta &&
                                path.node.meta.name === 'import' &&
                                path.node.property &&
                                path.node.property.name === 'meta'
                            ) {
                                path.replaceWithSourceString('({})');
                            }
                        },
                    },
                };
            },
            ...plugins,
        ],
    };
};
