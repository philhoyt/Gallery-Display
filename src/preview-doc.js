/**
 * Editor preview document builder.
 *
 * Lives apart from edit.js so it can be unit tested without pulling in the
 * WordPress editor packages, which are runtime externals and are not
 * resolvable outside a build.
 */

import { applyFilters } from '@wordpress/hooks';

import {
	esc,
	cssIdent,
	cssRatio,
	cssLength,
	intInRange,
	sanitizeCaption,
} from './sanitize';

const MOSAIC_LARGE = new Set( [ 0, 3 ] );

/**
 * Resolve a blockGap attribute value to a concrete CSS length string.
 *
 * WordPress stores spacing presets as "var:preset|spacing|80". We convert
 * that to "var(--wp--preset--spacing--80)" and then measure it in the
 * editor's document (where WP defines the preset vars) so the srcdoc iframe
 * gets a plain pixel value that works without WordPress's CSS being loaded.
 *
 * @param {string|undefined} raw The raw blockGap attribute value.
 * @return {string} A CSS length string, e.g. "24px".
 */
function resolveGapValue( raw ) {
	if ( ! raw ) {
		return '16px';
	}
	// "var:preset|spacing|80" → "var(--wp--preset--spacing--80)"
	let cssValue = raw;
	if ( raw.startsWith( 'var:' ) ) {
		cssValue = 'var(--wp--' + raw.slice( 4 ).replace( /\|/g, '--' ) + ')';
	}
	// Resolve in the editor document where WP preset vars are defined.
	const tmp = document.createElement( 'div' );
	tmp.style.cssText = 'position:absolute;visibility:hidden;width:' + cssValue;
	document.documentElement.appendChild( tmp );
	const px = tmp.offsetWidth;
	document.documentElement.removeChild( tmp );
	// Fall back to the CSS value itself if the measurement produced nothing
	// useful, but only after validating it — `raw` is an unvalidated attribute.
	return px > 0 ? px + 'px' : cssLength( cssValue, '16px' );
}

/**
 * Build a full standalone HTML document that renders the gallery using
 * the real frontend CSS and JS files, loaded from absolute URLs.
 * This is served as the iframe srcdoc so the preview always reflects
 * the current (unsaved) attributes with no server round-trip.
 *
 * Every attribute reaching this document is escaped or validated first —
 * see sanitize.js for why.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} pluginUrl  Absolute URL to the plugin root (trailing slash).
 * @return {string} Full HTML document.
 */
export function buildPreviewDoc( attributes, pluginUrl ) {
	const {
		images,
		layout,
		linkTo,
		columns,
		aspectRatio,
		rowHeight,
		showCaption,
		captionPosition,
		caption,
		style: blockStyle,
	} = attributes;

	// Validate every attribute that reaches the document before use.
	const safeLayout = cssIdent( layout, 'grid' );
	const safeCaption = cssIdent( captionPosition, 'below' );
	const safeRatio = cssRatio( aspectRatio, '1/1' );
	const safeColumns = intInRange( columns, 3, 1, 6 );
	const safeRowHeight = intInRange( rowHeight, 200, 80, 500 );
	const gap = resolveGapValue( blockStyle?.spacing?.blockGap );

	const cssVars = [
		`--ph-gallery-columns:${ safeColumns }`,
		`--ph-gallery-row-height:${ safeRowHeight }px`,
		`--ph-gallery-ratio:${ safeRatio }`,
		`--ph-gallery-gap:${ gap }`,
	].join( ';' );

	const wrapperClass = [
		'wp-block-ph-gallery-display',
		`is-layout-${ safeLayout }`,
		showCaption ? `has-caption caption-${ safeCaption }` : '',
	]
		.filter( Boolean )
		.join( ' ' );

	// Build figure items.
	const itemsHtml = images
		.map( ( img, i ) => {
			const isLarge =
				safeLayout === 'mosaic' && MOSAIC_LARGE.has( i % 5 );
			const itemClass = isLarge
				? 'ph-gallery-item ph-gallery-item--large'
				: 'ph-gallery-item';

			// render.php falls back to the thumbnail alt/title for the link's
			// accessible name; mirror that here so the preview matches.
			const linkLabel = img.alt || img.caption || img.title || '';
			const labelAttr = linkLabel
				? ''
				: ` aria-label="${ esc( img.filename || 'Image' ) }"`;

			let linkOpen = '';
			let linkClose = '';
			if ( linkTo === 'lightbox' ) {
				linkOpen = `<a href="${ esc(
					img.url
				) }" class="ph-gallery-item__link"${ labelAttr } data-pswp-width="${ esc(
					img.width
				) }" data-pswp-height="${ esc( img.height ) }">`;
				linkClose = '</a>';
			} else if ( linkTo === 'media' ) {
				linkOpen = `<a href="${ esc(
					img.url
				) }" class="ph-gallery-item__link"${ labelAttr }>`;
				linkClose = '</a>';
			} else if ( linkTo === 'attachment' ) {
				// `link` is the attachment page URL, stored by MediaSelector.
				// Older galleries saved before that was stored fall back to the
				// file URL — the preview's links are inert either way.
				linkOpen = `<a href="${ esc(
					img.link || img.url
				) }" class="ph-gallery-item__link"${ labelAttr }>`;
				linkClose = '</a>';
			}

			const captionHtml =
				showCaption && img.caption && safeLayout !== 'list'
					? `<figcaption class="ph-gallery-item__caption">${ esc(
							img.caption
					  ) }</figcaption>`
					: '';

			return `<figure class="${ itemClass }">${ linkOpen }<img src="${ esc(
				img.url
			) }" alt="${ esc( img.alt ) }" width="${ esc(
				img.width
			) }" height="${ esc( img.height ) }" data-width="${ esc(
				img.width
			) }" data-height="${ esc(
				img.height
			) }" loading="lazy" decoding="async">${ linkClose }${ captionHtml }</figure>`;
		} )
		.join( '' );

	// CSS.
	const b = esc( pluginUrl ) + 'build/';
	const extraStylesheets = applyFilters(
		'galleryDisplay.previewStylesheets',
		[],
		safeLayout
	);
	const css = [
		`<link rel="stylesheet" href="${ b }style-index.css">`,
		`<link rel="stylesheet" href="${ b }styles/${ safeLayout }.css">`,
		linkTo === 'lightbox'
			? `<link rel="stylesheet" href="${ b }frontend/init-lightbox.css">`
			: '',
		...extraStylesheets.map(
			( url ) => `<link rel="stylesheet" href="${ esc( url ) }">`
		),
	]
		.filter( Boolean )
		.join( '\n' );

	// JS — defer so the DOM is ready before init scripts run.
	const js = [
		safeLayout === 'masonry' || safeLayout === 'mosaic'
			? `<script src="${ b }frontend/isotope.js" defer></script>\n<script src="${ b }frontend/init-${ safeLayout }.js" defer></script>`
			: '',
		safeLayout === 'justified'
			? `<script src="${ b }frontend/justified-layout.js" defer></script>\n<script src="${ b }frontend/init-justified.js" defer></script>`
			: '',
		linkTo === 'lightbox'
			? `<script src="${ b }frontend/init-lightbox.js" defer></script>`
			: '',
	]
		.filter( Boolean )
		.join( '\n' );

	// Rich text, so it goes through the caption allowlist rather than esc().
	// Escaping it would render tags as visible text and make the preview
	// disagree with what render.php produces.
	const safeGalleryCaption = sanitizeCaption( caption );
	const galleryCaptionHtml = safeGalleryCaption
		? `<figcaption class="wp-block-ph-gallery-display__caption">${ safeGalleryCaption }</figcaption>`
		: '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ css }
<style>
  body { margin: 0; padding: 24px; box-sizing: border-box; background: #fff; }
  .wp-block-ph-gallery-display { max-width: 100%; margin: 0; }
  .ph-gallery-item { pointer-events: none; }
</style>
</head>
<body>
<figure class="${ wrapperClass }"
  data-layout="${ safeLayout }"
  data-columns="${ safeColumns }"
  data-row-height="${ safeRowHeight }"
  style="${ cssVars }"
>${ itemsHtml }${ galleryCaptionHtml }</figure>
${ js }
</body>
</html>`;
}
