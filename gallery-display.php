<?php
/**
 * Plugin Name:       Gallery Display
 * Plugin URI:        https://github.com/philhoyt/gallery-display
 * Description:       A flexible image gallery block with grid, masonry, mosaic, justified, and list layouts.
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Version:           1.0.0
 * Author:            Phil Hoyt
 * Author URI:        https://philhoyt.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       gallery-display
 *
 * @package PH\GalleryDisplay
 */

namespace PH\GalleryDisplay;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GALLERY_DISPLAY_VERSION', '1.0.0' );
define( 'GALLERY_DISPLAY_DIR', plugin_dir_path( __FILE__ ) );
define( 'GALLERY_DISPLAY_URL', plugin_dir_url( __FILE__ ) );

/**
 * Register the block and its per-layout stylesheets.
 *
 * Layout stylesheets are registered with wp_enqueue_block_style(), which
 * correctly injects styles into the editor's iframe canvas and the frontend.
 * It only loads when the ph/gallery-display block is present on the page,
 * making it safe to register all five layout sheets unconditionally — they
 * are small, scoped, and do not conflict with one another.
 *
 * The shared style-index.css is handled automatically by WordPress via the
 * "style" field in block.json and is not registered here.
 */
function register_block(): void {
	register_block_type( __DIR__ . '/build' );

	$layouts = array( 'grid', 'masonry', 'mosaic', 'justified', 'list' );

	foreach ( $layouts as $layout ) {
		wp_enqueue_block_style(
			'ph/gallery-display',
			array(
				'handle' => "ph-gallery-display-{$layout}",
				'src'    => GALLERY_DISPLAY_URL . "build/styles/{$layout}.css",
				'ver'    => GALLERY_DISPLAY_VERSION,
			)
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\\register_block' );

/**
 * Expose the plugin URL to the block editor JS so the preview modal can
 * load frontend CSS/JS from absolute URLs without a server round-trip.
 */
function enqueue_editor_data(): void {
	wp_add_inline_script(
		'wp-blocks',
		'window.GalleryDisplayPluginUrl = ' . wp_json_encode( GALLERY_DISPLAY_URL ) . ';',
		'before'
	);
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\\enqueue_editor_data' );

/**
 * REST endpoint that returns all registered image sizes with human-readable
 * labels. Used by the inspector's thumbnail-size and full-size dropdowns.
 *
 * Route: GET /gallery-display/v1/image-sizes
 * Auth:  requires edit_posts capability.
 */
function register_rest_routes(): void {
	register_rest_route(
		'gallery-display/v1',
		'/image-sizes',
		array(
			'methods'             => 'GET',
			'callback'            => __NAMESPACE__ . '\\rest_get_image_sizes',
			'permission_callback' => static fn() => current_user_can( 'edit_posts' ),
		)
	);
}
add_action( 'rest_api_init', __NAMESPACE__ . '\\register_rest_routes' );

/**
 * Build and return the image sizes array.
 *
 * @return array<int, array{slug: string, label: string}>
 */
function rest_get_image_sizes(): array {
	$sizes  = get_intermediate_image_sizes();
	$result = array();

	foreach ( $sizes as $slug ) {
		$additional = wp_get_additional_image_sizes();
		if ( isset( $additional[ $slug ] ) ) {
			$w = (int) $additional[ $slug ]['width'];
			$h = (int) $additional[ $slug ]['height'];
		} else {
			$w = (int) get_option( "{$slug}_size_w" );
			$h = (int) get_option( "{$slug}_size_h" );
		}

		$label = ucwords( str_replace( array( '-', '_' ), ' ', $slug ) );
		if ( $w && $h ) {
			$label .= " ({$w} \u{00D7} {$h})";
		}

		$result[] = array(
			'slug'  => $slug,
			'label' => $label,
		);
	}

	// 'full' is not returned by get_intermediate_image_sizes().
	$result[] = array(
		'slug'  => 'full',
		'label' => __( 'Full Size', 'gallery-display' ),
	);

	return $result;
}
