module.exports = function (api) {
    api && api.cache && api.cache(true);

    // Use Expo's preset when available, fallback to a sensible default.
    const presets = [];
    try {
        // Enable Expo preset and request its unstable import.meta transform.
        // This lets Expo's tooling transform `import.meta` into a safe runtime
        // representation when possible.
        presets.push([require.resolve('babel-preset-expo'), { unstable_transformImportMeta: true }]);
    } catch (e) {
        // preset not installed in CI/dev; let Expo/Metro handle defaults.
    }

    return {
        presets,
        plugins: [
            // Allow parsing of import.meta and replace it with a safe empty object
            // so runtime checks like `(import.meta.env ? ...)` become safe.
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
        ],
    };
};
