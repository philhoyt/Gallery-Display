const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: async () => {
		// @wordpress/scripts auto-discovers src/block.json and generates the
		// editor block entry (index) plus the style-index CSS entry. We merge
		// in the additional frontend entries manually.
		const discovered =
			typeof defaultConfig.entry === 'function'
				? await defaultConfig.entry()
				: defaultConfig.entry;

		return {
			...discovered,

			// Library bundles: assign to window globals so both masonry and
			// mosaic init scripts share a single Isotope copy without webpack
			// bundling it twice into separate entry chunks.
			'frontend/isotope':          './src/frontend/isotope.js',
			'frontend/justified-layout': './src/frontend/justified-layout.js',

			// Layout init scripts. Masonry/mosaic/justified read from window
			// globals set by the library bundles above. Lightbox imports
			// PhotoSwipe directly (single consumer, no global needed) and its
			// CSS import is extracted to build/frontend/init-lightbox.css.
			'frontend/init-masonry':   './src/frontend/init-masonry.js',
			'frontend/init-mosaic':    './src/frontend/init-mosaic.js',
			'frontend/init-justified': './src/frontend/init-justified.js',
			'frontend/init-lightbox':  './src/frontend/init-lightbox.js',

			// Layout-specific CSS bundles — enqueued conditionally by render.php.
			// webpack extracts these to build/styles/*.css via MiniCssExtractPlugin.
			// The accompanying *.js stubs are generated but never enqueued.
			'styles/grid':      './src/styles/grid.css',
			'styles/masonry':   './src/styles/masonry.css',
			'styles/mosaic':    './src/styles/mosaic.css',
			'styles/justified': './src/styles/justified.css',
			'styles/list':      './src/styles/list.css',
		};
	},
};
