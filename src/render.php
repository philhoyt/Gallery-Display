<?php
/**
 * Server-side render for the ph/gallery-display block.
 *
 * Copied from src/ to build/ during compilation (WP_COPY_PHP_FILES_TO_DIST=true).
 * At runtime this file lives at build/render.php, so __FILE__ points there.
 * Use GALLERY_DISPLAY_URL (defined in the main plugin file) for asset URLs.
 *
 * WordPress provides these variables when this file is used as a render callback:
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content (unused — no inner blocks).
 * @var WP_Block $block      Block instance.
 *
 * @package PH\GalleryDisplay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

( static function ( array $attributes ): void {

	// 1. Resolve attributes with defaults.

	$images           = $attributes['images'] ?? array();
	$layout           = $attributes['layout'] ?? 'grid';
	$link_to          = $attributes['linkTo'] ?? 'lightbox';
	$thumbnail_size   = $attributes['thumbnailSize'] ?? 'large';
	$full_size        = $attributes['fullSize'] ?? 'full';
	$show_caption     = ! empty( $attributes['showCaption'] );
	$caption_position = $attributes['captionPosition'] ?? 'below';
	$columns          = isset( $attributes['columns'] ) ? (int) $attributes['columns'] : 3;
	$aspect_ratio     = $attributes['aspectRatio'] ?? '1/1';
	$row_height       = isset( $attributes['rowHeight'] ) ? (int) $attributes['rowHeight'] : 200;

	if ( empty( $images ) ) {
		return;
	}

	$valid_layouts  = apply_filters( 'gallery_display_valid_layouts', array( 'grid', 'masonry', 'mosaic', 'justified', 'list' ) );
	$valid_link_tos = array( 'lightbox', 'attachment', 'media', 'none' );
	$layout         = in_array( $layout, $valid_layouts, true ) ? $layout : 'grid';
	$link_to        = in_array( $link_to, $valid_link_tos, true ) ? $link_to : 'lightbox';

	// 2. Enqueue layout-specific JS (frontend only).
	// Layout CSS is registered via wp_enqueue_block_style() in the main plugin
	// file — it loads automatically when the block is present on any page,
	// including correctly inside the editor's iframe canvas.
	// Only JS enqueue is handled here because it must remain conditional
	// (Isotope and justified-layout are heavy; loading them on every page
	// with a grid or list gallery would be wasteful).
	// WordPress deduplicates handles, so multiple galleries on one page are safe.

	// Plugin root URL — falls back to dirname(dirname()) since this file lives
	// in build/ at runtime.
	$plugin_url = defined( 'GALLERY_DISPLAY_URL' )
		? GALLERY_DISPLAY_URL
		: plugin_dir_url( __DIR__ );
	// null rather than a literal: a second copy of the version here would drift
	// out of sync the way the constant itself did. The constant is defined
	// before any block renders, so the fallback is only a guard.
	$version = defined( 'GALLERY_DISPLAY_VERSION' ) ? GALLERY_DISPLAY_VERSION : null;

	if ( 'masonry' === $layout || 'mosaic' === $layout ) {
		wp_enqueue_script(
			'ph-gallery-display-isotope',
			$plugin_url . 'build/frontend/isotope.js',
			array(),
			$version,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);

		wp_enqueue_script(
			"ph-gallery-display-init-{$layout}",
			$plugin_url . "build/frontend/init-{$layout}.js",
			array( 'ph-gallery-display-isotope' ),
			$version,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);
	}

	if ( 'justified' === $layout ) {
		wp_enqueue_script(
			'ph-gallery-display-justified-layout',
			$plugin_url . 'build/frontend/justified-layout.js',
			array(),
			$version,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);

		wp_enqueue_script(
			'ph-gallery-display-init-justified',
			$plugin_url . 'build/frontend/init-justified.js',
			array( 'ph-gallery-display-justified-layout' ),
			$version,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);
	}

	if ( 'lightbox' === $link_to ) {
		// The PhotoSwipe stylesheet is registered with wp_enqueue_block_style()
		// in the main plugin file so it lands in the head — enqueueing it here
		// printed it after wp_head and caused a flash of unstyled links.
		wp_enqueue_script(
			'ph-gallery-display-init-lightbox',
			$plugin_url . 'build/frontend/init-lightbox.js',
			array(),
			$version,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);
	}

	// 3. Resolve image data from attachment IDs.
	// All display metadata is fetched fresh at render time so any media
	// library edit is reflected automatically in every gallery it appears in.

	$resolved = array();

	foreach ( $images as $img_data ) {
		$id = isset( $img_data['id'] ) ? (int) $img_data['id'] : 0;
		if ( ! $id ) {
			continue;
		}

		$post = get_post( $id );
		if ( ! $post || 'attachment' !== $post->post_type ) {
			continue;
		}

		$thumb = wp_get_attachment_image_src( $id, $thumbnail_size );
		if ( ! $thumb ) {
			continue;
		}

		list( $thumb_url, $thumb_w, $thumb_h ) = $thumb;

		$full = wp_get_attachment_image_src( $id, $full_size );
		if ( $full ) {
			list( $full_url, $full_w, $full_h ) = $full;
		} else {
			list( $full_url, $full_w, $full_h ) = array( $thumb_url, $thumb_w, $thumb_h );
		}

		// Overrides come from a block-level edit — today only a transform from
		// core/gallery sets them. When one is absent the attachment is read as
		// before, which is what keeps a media-library edit propagating to every
		// gallery. An override is deliberately allowed to be an empty string:
		// that is a real choice, distinct from "not set".
		$alt_override     = $img_data['altOverride'] ?? null;
		$caption_override = $img_data['captionOverride'] ?? null;
		$is_decorative    = ! empty( $img_data['isDecorative'] );

		$alt = is_string( $alt_override )
			? $alt_override
			: (string) get_post_meta( $id, '_wp_attachment_image_alt', true );

		// A decorative image is unlabelled on purpose. The link that may wrap
		// it still needs an accessible name — see where the anchor is built.
		if ( $is_decorative ) {
			$alt = '';
		}

		$caption = is_string( $caption_override )
			? $caption_override
			: (string) wp_get_attachment_caption( $id );

		$resolved[] = array(
			'id'             => $id,
			'thumb_url'      => $thumb_url,
			'thumb_w'        => (int) $thumb_w,
			'thumb_h'        => (int) $thumb_h,
			'full_url'       => $full_url,
			'full_w'         => (int) $full_w,
			'full_h'         => (int) $full_h,
			'alt'            => $alt,
			'is_decorative'  => $is_decorative,
			'caption'        => $caption,
			'title'          => $post->post_title,
			'desc'           => $post->post_content,
			'attachment_url' => get_permalink( $id ),
			'post_date'      => $post->post_date,
			'link_target'    => isset( $img_data['linkTarget'] ) ? (string) $img_data['linkTarget'] : '',
			'link_rel'       => isset( $img_data['rel'] ) ? (string) $img_data['rel'] : '',
		);
	}

	if ( empty( $resolved ) ) {
		return;
	}

	// 3b. Apply ordering.
	$order_by     = $attributes['orderBy'] ?? 'default';
	$valid_orders = array( 'default', 'date-asc', 'date-desc', 'title-asc', 'title-desc', 'rand', 'auto' );
	$order_by     = in_array( $order_by, $valid_orders, true ) ? $order_by : 'default';

	switch ( $order_by ) {
		case 'date-asc':
			usort( $resolved, static fn( $a, $b ) => $a['post_date'] <=> $b['post_date'] );
			break;

		case 'date-desc':
			usort( $resolved, static fn( $a, $b ) => $b['post_date'] <=> $a['post_date'] );
			break;

		case 'title-asc':
			usort( $resolved, static fn( $a, $b ) => strcmp( $a['title'], $b['title'] ) );
			break;

		case 'title-desc':
			usort( $resolved, static fn( $a, $b ) => strcmp( $b['title'], $a['title'] ) );
			break;

		case 'rand':
			shuffle( $resolved );
			break;

		case 'auto':
			// Mosaic best-fit: wide images (landscape) go into the large 4:3
			// slots (positions 0 and 3 of every 5); portrait/square images fill
			// the remaining 1:1 slots.
			if ( 'mosaic' === $layout ) {
				$wide   = array();
				$narrow = array();

				foreach ( $resolved as $img ) {
					$ratio = ( $img['full_w'] > 0 && $img['full_h'] > 0 )
						? $img['full_w'] / $img['full_h']
						: 1.0;
					if ( $ratio > 1.0 ) {
						$wide[] = $img;
					} else {
						$narrow[] = $img;
					}
				}

				$sorted     = array();
				$wide_idx   = 0;
				$narrow_idx = 0;
				$total      = count( $resolved );

				for ( $i = 0; $i < $total; $i++ ) {
					$is_large = in_array( $i % 5, array( 0, 3 ), true );

					if ( $is_large && $wide_idx < count( $wide ) ) {
						$sorted[] = $wide[ $wide_idx++ ];
					} elseif ( ! $is_large && $narrow_idx < count( $narrow ) ) {
						$sorted[] = $narrow[ $narrow_idx++ ];
					} elseif ( $wide_idx < count( $wide ) ) {
						$sorted[] = $wide[ $wide_idx++ ];
					} else {
						$sorted[] = $narrow[ $narrow_idx++ ];
					}
				}

				$resolved = $sorted;
			}
			break;
	}

	// 4. Build wrapper attributes.
	// CSS custom properties carry gap, columns, aspect-ratio, and border values
	// so layout CSS never needs to repeat them as inline styles.

	// Block attributes come from post content and are not validated by the
	// block API. get_block_wrapper_attributes() runs esc_attr() over its
	// values, so an attribute cannot break out of the style="" quoting — but
	// a crafted value could still append its own CSS declaration inside it
	// (e.g. an aspect ratio of "1/1;background:url(https://…)"). Validate the
	// two free-form values before they reach the declaration list. $columns
	// and $row_height are already cast to int above.

	$gap_raw = $attributes['style']['spacing']['blockGap'] ?? null;
	$gap     = is_string( $gap_raw ) && '' !== $gap_raw ? $gap_raw : '16px';

	// WordPress stores spacing presets as "var:preset|spacing|80".
	// Convert to a valid CSS value: "var(--wp--preset--spacing--80)".
	if ( str_starts_with( $gap, 'var:' ) ) {
		$gap = 'var(--wp--' . str_replace( '|', '--', substr( $gap, 4 ) ) . ')';
	}

	if ( ! preg_match( '/^(?:\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh)|var\(--wp--[a-zA-Z0-9-]+\))$/', $gap ) ) {
		$gap = '16px';
	}

	if ( ! preg_match( '#^\d+(?:\.\d+)?\s*/\s*\d+(?:\.\d+)?$#', (string) $aspect_ratio ) ) {
		$aspect_ratio = '';
	}

	$css_vars = array(
		"--ph-gallery-columns:{$columns}",
		"--ph-gallery-row-height:{$row_height}px",
		"--ph-gallery-gap:{$gap}",
	);

	if ( $aspect_ratio ) {
		$css_vars[] = "--ph-gallery-ratio:{$aspect_ratio}";
	}

	// $layout is already whitelisted above; $caption_position is not.
	$extra_class = "is-layout-{$layout}";
	if ( $show_caption ) {
		$extra_class .= ' has-caption caption-' . sanitize_html_class( $caption_position, 'below' );
	}

	$wrapper_args = array(
		'class'           => $extra_class,
		'data-layout'     => $layout,
		'data-link-to'    => $link_to,
		'data-columns'    => (string) $columns,
		'data-row-height' => (string) $row_height,
		'style'           => implode( ';', $css_vars ),
	);

	// The anchor is emitted here rather than left to core's anchor block
	// support: wp-includes/block-supports/anchor.php is @since 7.0.0, and this
	// plugin supports WordPress 6.6, where it does not exist and the id would
	// silently never render. On 7.0+ core produces the same value from the same
	// attribute, so the two agree. get_block_wrapper_attributes() applies
	// esc_attr() to the value, which is exactly what core's anchor support
	// relies on, so duplicate-id behaviour matches core rather than being
	// stricter.
	$anchor = isset( $attributes['anchor'] ) ? trim( (string) $attributes['anchor'] ) : '';
	if ( '' !== $anchor ) {
		$wrapper_args['id'] = $anchor;
	}

	$wrapper_attrs = get_block_wrapper_attributes( $wrapper_args );

	// 5. Output.

	// A <figure> rather than a <div> so the gallery caption below can be a
	// <figcaption>, which is only valid inside a figure. This is what
	// core/gallery does. style.css resets the browser default figure margin.
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	printf( '<figure %s>', $wrapper_attrs );

	// Mosaic pattern: positions 0 and 3 within each group of 5 get the --large
	// modifier (2/3 container width). Packery fills the remaining column.
	$mosaic_large = array( 0, 3 );

	foreach ( $resolved as $i => $img ) {
		$item_class = 'ph-gallery-item';

		if ( 'mosaic' === $layout && in_array( $i % 5, $mosaic_large, true ) ) {
			$item_class .= ' ph-gallery-item--large';
		}

		echo '<figure class="' . esc_attr( $item_class ) . '">';

		$href        = '';
		$link_extras = '';

		switch ( $link_to ) {
			case 'lightbox':
				$href        = esc_url( $img['full_url'] );
				$link_extras = sprintf(
					' data-pswp-width="%d" data-pswp-height="%d"',
					absint( $img['full_w'] ),
					absint( $img['full_h'] )
				);
				if ( $img['title'] ) {
					$link_extras .= ' data-pswp-title="' . esc_attr( $img['title'] ) . '"';
				}
				if ( $img['caption'] ) {
					$link_extras .= ' data-pswp-caption="' . esc_attr( $img['caption'] ) . '"';
				}
				break;

			case 'attachment':
				$href = esc_url( $img['attachment_url'] );
				break;

			case 'media':
				$href = esc_url( $img['full_url'] );
				break;
		}

		// The link's only content is the <img>. When the image has no alt text
		// it contributes no accessible name, leaving the link unnamed for
		// screen-reader users (WCAG 2.4.4, 4.1.2). Fall back to the attachment
		// title, then its caption.
		//
		// This deliberately also applies to an image marked decorative. Being
		// decorative is a statement about the image, not about the link that
		// wraps it — a link still needs a name. Skipping the fallback here
		// would recreate the very failure this check was added to fix.
		if ( $href && '' === trim( (string) $img['alt'] ) ) {
			$link_label = $img['title'] ? $img['title'] : $img['caption'];
			if ( $link_label ) {
				$link_extras .= ' aria-label="' . esc_attr( wp_strip_all_tags( $link_label ) ) . '"';
			}
		}

		if ( $href ) {
			// Validate rather than merely escape. esc_attr() would stop an
			// attribute breaking out, but would happily emit target="evil" or a
			// rel that drops noopener.
			$allowed_targets = array( '_blank', '_self', '_parent', '_top' );
			$link_target     = in_array( $img['link_target'], $allowed_targets, true )
				? $img['link_target']
				: '';

			$rel_tokens = preg_split( '/\s+/', strtolower( $img['link_rel'] ), -1, PREG_SPLIT_NO_EMPTY );
			$rel_tokens = is_array( $rel_tokens ) ? $rel_tokens : array();

			// Appended last and after de-duplication, so a crafted rel cannot
			// remove it from a link that opens in a new tab.
			if ( '_blank' === $link_target ) {
				$rel_tokens[] = 'noopener';
			}

			$rel_tokens = array_unique( $rel_tokens );

			if ( $link_target ) {
				$link_extras .= ' target="' . esc_attr( $link_target ) . '"';
			}
			if ( $rel_tokens ) {
				$link_extras .= ' rel="' . esc_attr( implode( ' ', $rel_tokens ) ) . '"';
			}

			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			printf( '<a href="%s" class="ph-gallery-item__link"%s>', $href, $link_extras );
		}

		printf(
			'<img src="%s" alt="%s" width="%d" height="%d" loading="lazy" decoding="async" data-width="%d" data-height="%d">',
			esc_url( $img['thumb_url'] ),
			esc_attr( $img['alt'] ),
			absint( $img['thumb_w'] ),
			absint( $img['thumb_h'] ),
			absint( $img['thumb_w'] ),
			absint( $img['thumb_h'] )
		);

		if ( $href ) {
			echo '</a>';
		}

		if ( $show_caption && $img['caption'] && 'list' !== $layout ) {
			printf(
				'<figcaption class="ph-gallery-item__caption">%s</figcaption>',
				wp_kses_post( $img['caption'] )
			);
		}

		if ( 'list' === $layout ) {
			if ( $img['caption'] ) {
				printf( '<p class="ph-gallery-item__caption">%s</p>', wp_kses_post( $img['caption'] ) );
			}
			if ( $img['desc'] ) {
				printf( '<div class="ph-gallery-item__desc">%s</div>', wp_kses_post( $img['desc'] ) );
			}
		}

		echo '</figure>';
	}

	// Gallery-level caption, last so it sits below the images. Rich text, as in
	// core/gallery, so it is filtered with wp_kses_post() rather than flattened
	// to plain text — the editor preview applies a matching allowlist.
	$gallery_caption = isset( $attributes['caption'] ) ? (string) $attributes['caption'] : '';
	if ( '' !== trim( $gallery_caption ) ) {
		printf(
			'<figcaption class="wp-block-ph-gallery-display__caption">%s</figcaption>',
			wp_kses_post( $gallery_caption )
		);
	}

	echo '</figure>';
} )( $attributes );
