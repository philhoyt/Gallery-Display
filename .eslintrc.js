/**
 * ESLint configuration.
 *
 * @wordpress/scripts 30 bundles ESLint 8, which uses this legacy format.
 * Moving to @wordpress/scripts 32+ means migrating this file to
 * eslint.config.js flat config.
 */
module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		// Set by wp_add_inline_script in gallery-display.php.
		GalleryDisplayPluginUrl: 'readonly',
		// Set by the bundled library entry points (isotope.js,
		// justified-layout.js) for the init scripts to read.
		IsotopeLib: 'writable',
		JustifiedLayoutLib: 'writable',
	},
	overrides: [
		{
			files: [ '**/*.test.js' ],
			env: { jest: true },
		},
	],
};
