import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';

import Inspector from './inspector';
import MediaSelector from './MediaSelector';

const MOSAIC_LARGE = new Set( [ 0, 3 ] );

/**
 * Escape a value for use inside an HTML attribute (double-quoted).
 *
 * @param {*} val
 * @return {string}
 */
function esc( val ) {
	return String( val ?? '' )
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

/**
 * Build a full standalone HTML document that renders the gallery using
 * the real frontend CSS and JS files, loaded from absolute URLs.
 * This is served as the iframe srcdoc so the preview always reflects
 * the current (unsaved) attributes with no server round-trip.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} pluginUrl  Absolute URL to the plugin root (trailing slash).
 * @return {string} Full HTML document.
 */
function buildPreviewDoc( attributes, pluginUrl ) {
	const {
		images,
		layout,
		linkTo,
		columns,
		aspectRatio,
		rowHeight,
		showCaption,
		captionPosition,
	} = attributes;

	const cssVars = [
		`--ph-gallery-columns:${ columns }`,
		`--ph-gallery-row-height:${ rowHeight }px`,
		`--ph-gallery-ratio:${ aspectRatio }`,
	].join( ';' );

	const wrapperClass = [
		'wp-block-ph-gallery-display',
		`is-layout-${ layout }`,
		showCaption ? `has-caption caption-${ captionPosition }` : '',
	].filter( Boolean ).join( ' ' );

	// Build figure items.
	const itemsHtml = images
		.map( ( img, i ) => {
			const isLarge = layout === 'mosaic' && MOSAIC_LARGE.has( i % 5 );
			const itemClass = isLarge
				? 'ph-gallery-item ph-gallery-item--large'
				: 'ph-gallery-item';

			let linkOpen  = '';
			let linkClose = '';
			if ( linkTo === 'lightbox' ) {
				linkOpen = `<a href="${ esc( img.url ) }" class="ph-gallery-item__link" data-pswp-width="${ esc( img.width ) }" data-pswp-height="${ esc( img.height ) }">`;
				linkClose = '</a>';
			} else if ( linkTo === 'media' ) {
				linkOpen  = `<a href="${ esc( img.url ) }" class="ph-gallery-item__link">`;
				linkClose = '</a>';
			}

			const captionHtml =
				showCaption && img.caption && layout !== 'list'
					? `<figcaption class="ph-gallery-item__caption">${ esc( img.caption ) }</figcaption>`
					: '';

			return `<figure class="${ itemClass }">${ linkOpen }<img src="${ esc( img.url ) }" alt="${ esc( img.alt ) }" width="${ esc( img.width ) }" height="${ esc( img.height ) }" data-width="${ esc( img.width ) }" data-height="${ esc( img.height ) }" loading="lazy" decoding="async">${ linkClose }${ captionHtml }</figure>`;
		} )
		.join( '' );

	// CSS.
	const b = pluginUrl + 'build/';
	const css = [
		`<link rel="stylesheet" href="${ b }style-index.css">`,
		`<link rel="stylesheet" href="${ b }styles/${ layout }.css">`,
		linkTo === 'lightbox'
			? `<link rel="stylesheet" href="${ b }frontend/init-lightbox.css">`
			: '',
	].filter( Boolean ).join( '\n' );

	// JS — defer so the DOM is ready before init scripts run.
	const js = [
		layout === 'masonry' || layout === 'mosaic'
			? `<script src="${ b }frontend/isotope.js" defer></script>\n<script src="${ b }frontend/init-${ layout }.js" defer></script>`
			: '',
		layout === 'justified'
			? `<script src="${ b }frontend/justified-layout.js" defer></script>\n<script src="${ b }frontend/init-justified.js" defer></script>`
			: '',
		linkTo === 'lightbox'
			? `<script src="${ b }frontend/init-lightbox.js" defer></script>`
			: '',
	].filter( Boolean ).join( '\n' );

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ css }
<style>
  body { margin: 0; padding: 24px; box-sizing: border-box; background: #fff; }
  .wp-block-ph-gallery-display { max-width: 100%; }
</style>
</head>
<body>
<div class="${ wrapperClass }"
  data-layout="${ esc( layout ) }"
  data-columns="${ esc( columns ) }"
  data-row-height="${ esc( rowHeight ) }"
  style="${ cssVars }"
>${ itemsHtml }</div>
${ js }
</body>
</html>`;
}

export default function Edit( { attributes, setAttributes } ) {
	const { images, layout } = attributes;

	const blockProps = useBlockProps( {
		className: 'ph-gallery-display-editor',
	} );

	const [ isPreviewOpen, setIsPreviewOpen ] = useState( false );

	// Set by wp_add_inline_script in gallery-display.php.
	// eslint-disable-next-line no-undef
	const pluginUrl = window.GalleryDisplayPluginUrl ?? '';

	const previewDoc = images?.length && pluginUrl
		? buildPreviewDoc( attributes, pluginUrl )
		: null;

	// --- Empty state ---
	if ( ! images || images.length === 0 ) {
		return (
			<>
				<Inspector attributes={ attributes } setAttributes={ setAttributes } />
				<div { ...blockProps }>
					<Placeholder
						icon="format-gallery"
						label={ __( 'Gallery Display', 'gallery-display' ) }
						instructions={ __(
							'Select images from the media library to build your gallery.',
							'gallery-display'
						) }
					>
						<MediaSelector
							images={ images }
							onSelect={ ( selected ) =>
								setAttributes( { images: selected } )
							}
							buttonLabel={ __( 'Add Images', 'gallery-display' ) }
						/>
					</Placeholder>
				</div>
			</>
		);
	}

	// --- Gallery editor ---
	return (
		<>
			<Inspector attributes={ attributes } setAttributes={ setAttributes } />
			<div { ...blockProps }>
				<div className="ph-gallery-display-editor__thumbs">
					{ images.map( ( img ) => (
						<div
							key={ img.id }
							className="ph-gallery-display-editor__thumb"
						>
							<img src={ img.url } alt={ img.alt || '' } />
						</div>
					) ) }
				</div>
				<div className="ph-gallery-display-editor__footer">
					<span className="ph-gallery-display-editor__meta">
						{ images.length }{ ' ' }
						{ __( 'images', 'gallery-display' ) }
						{ ' · ' }
						{ layout }
					</span>
					<Button
						variant="secondary"
						size="compact"
						onClick={ () => setIsPreviewOpen( true ) }
					>
						{ __( 'Preview', 'gallery-display' ) }
					</Button>
				</div>
			</div>

			{ isPreviewOpen && previewDoc && (
				<Modal
					title={ __( 'Gallery Preview', 'gallery-display' ) }
					onRequestClose={ () => setIsPreviewOpen( false ) }
					size="fill"
					className="ph-gallery-display-preview-modal"
				>
					<iframe
						srcDoc={ previewDoc }
						title={ __( 'Gallery Preview', 'gallery-display' ) }
						className="ph-gallery-display-preview-modal__iframe"
					/>
				</Modal>
			) }
		</>
	);
}
