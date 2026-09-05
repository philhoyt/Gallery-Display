/*
 * ESLint flat config.
 *
 * wp-scripts 32 and later bundle ESLint 10, which uses this format and
 * ignores .eslintrc.*. This extends the config wp-scripts would otherwise
 * apply on its own, adding only what this project needs on top.
 */
const globals = require( 'globals' );
const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...defaultConfig,

	{
		languageOptions: {
			globals: {
				// Everything here ships to the browser: the frontend
				// initializers use getComputedStyle and ResizeObserver, and
				// the editor reads window.GalleryDisplayPluginUrl, set by
				// wp_add_inline_script in gallery-display.php.
				...globals.browser,
			},
		},
		rules: {
			// @wordpress/* packages are WordPress runtime externals. The
			// dependency-extraction webpack plugin maps each import to the
			// matching wp.* global and emits a script dependency, so they are
			// deliberately not installed as project dependencies. Neither
			// import rule can express "ignore this scope", and both would
			// otherwise fire on every editor import in the plugin.
			'import/no-unresolved': [ 'error', { ignore: [ '^@wordpress/' ] } ],
			'import/no-extraneous-dependencies': 'off',
		},
	},

	{
		files: [ '**/*.test.js' ],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
];
