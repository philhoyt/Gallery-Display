/*
 * ESLint configuration.
 *
 * wp-scripts 30 bundles ESLint 8, which uses this legacy format. Moving to
 * wp-scripts 32 or later means migrating this file to eslint.config.js
 * flat config.
 */
module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	env: {
		// Everything here ships to the browser: the frontend initializers use
		// getComputedStyle and ResizeObserver, and the editor code reads
		// window.GalleryDisplayPluginUrl set by wp_add_inline_script.
		browser: true,
	},
	overrides: [
		{
			files: [ '**/*.test.js' ],
			env: { jest: true },
		},
	],
};
