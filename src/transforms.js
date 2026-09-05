/**
 * Mapping between core/gallery and ph/gallery-display.
 *
 * These functions are pure and deliberately free of createBlock(), so they can
 * be unit tested without the editor packages — the same constraint that moved
 * buildPreviewDoc() out of edit.js. src/index.js wraps them in the actual
 * block transforms.
 *
 * Verified against WordPress 7.1 rather than assumed: core/gallery stores its
 * images as innerBlocks of core/image, not in the legacy `images` attribute,
 * and WordPress migrates pre-5.9 galleries to that shape at parse time. There
 * is therefore no legacy branch here by design.
 */

import { intInRange } from './sanitize';

export const CORE_GALLERY = 'core/gallery';
export const CORE_IMAGE = 'core/image';

// Layouts that show images at their natural height. Everything else crops.
const UNCROPPED_LAYOUTS = [ 'masonry', 'justified', 'list' ];

/**
 * Whether an inner block is a core/image we can actually use.
 *
 * A gallery can contain blocks other than images, and an image block can exist
 * with neither an id nor a url while a user is still placing it. Both are
 * skipped. `isMatch` uses this same predicate so the transform is never
 * offered for a gallery that would convert to nothing.
 *
 * @param {Object} block Inner block.
 * @return {boolean} True when the block yields an image.
 */
export function isUsableImageBlock( block ) {
	if ( ! block || CORE_IMAGE !== block.name ) {
		return false;
	}
	const { id, url } = block.attributes ?? {};
	return Number( id ) > 0 || ( 'string' === typeof url && '' !== url );
}

/**
 * Whether a gallery holds at least one usable image.
 *
 * @param {Array} innerBlocks Gallery inner blocks.
 * @return {boolean} True when the transform is worth offering.
 */
export function hasUsableImages( innerBlocks ) {
	return (
		Array.isArray( innerBlocks ) && innerBlocks.some( isUsableImageBlock )
	);
}

/**
 * Clamp a column count to what this block's control allows.
 *
 * Core permits up to 8; the inspector's RangeControl is 1–6.
 *
 * @param {*} value Raw column count.
 * @return {number} A column count this block can display.
 */
export function clampColumns( value ) {
	return intInRange( value, 3, 1, 6 );
}

/**
 * Map core's linkTo onto this block's.
 *
 * @param {*} value Core linkTo.
 * @return {string} This block's linkTo.
 */
export function linkToFromCore( value ) {
	return [ 'media', 'attachment', 'none' ].includes( value ) ? value : 'none';
}

/**
 * Map this block's linkTo back onto core's.
 *
 * `lightbox` has no core equivalent — core's gallery has no lightbox setting —
 * so it becomes `media`, which keeps the closest behaviour: clicking an image
 * still opens it at full size.
 *
 * @param {*} value This block's linkTo.
 * @return {string} Core linkTo.
 */
export function linkToToCore( value ) {
	if ( 'lightbox' === value ) {
		return 'media';
	}
	return [ 'media', 'attachment', 'none' ].includes( value ) ? value : 'none';
}

/**
 * Whether a value authored on the block should be stored as an override.
 *
 * An override exists to preserve something the author wrote that the
 * attachment does not say. Storing one when the values match would freeze a
 * caption that should keep following the media library.
 *
 * When the attachment's own value is unknown — `getMedia` had nothing cached
 * at transform time — the override is stored. That failure mode is
 * deliberate: a caption that stops auto-updating can be cleared by the user,
 * whereas one silently discarded is gone.
 *
 * @param {*} coreValue Value from the core block.
 * @param {*} metaValue Value from the attachment, or undefined when unknown.
 * @return {boolean} True when the value should be stored as an override.
 */
export function shouldStoreOverride( coreValue, metaValue ) {
	if ( 'string' !== typeof coreValue || '' === coreValue ) {
		return false;
	}
	if ( undefined === metaValue || null === metaValue ) {
		return true;
	}
	return coreValue !== metaValue;
}

/**
 * Copy the block-support attributes the two blocks share.
 *
 * Without this a transform silently resets a gallery's alignment, custom
 * class, block gap, background and border — all of which live in these
 * attributes rather than in the block's own.
 *
 * @param {Object} attributes Source attributes.
 * @return {Object} Only the support attributes that are set.
 */
function copySupportAttributes( attributes ) {
	const out = {};
	[
		'align',
		'anchor',
		'className',
		'style',
		'backgroundColor',
		'gradient',
	].forEach( ( key ) => {
		if ( undefined !== attributes[ key ] && null !== attributes[ key ] ) {
			out[ key ] = attributes[ key ];
		}
	} );
	return out;
}

/**
 * Convert a core/gallery into this block's attributes.
 *
 * @param {Object} attributes     core/gallery attributes.
 * @param {Array}  innerBlocks    Its core/image inner blocks.
 * @param {Object} attachmentMeta Map of attachment id to { alt, caption },
 *                                used to decide whether to store an override.
 * @return {Object} Attributes for ph/gallery-display.
 */
export function galleryToDisplay(
	attributes = {},
	innerBlocks = [],
	attachmentMeta = {}
) {
	const images = ( innerBlocks ?? [] )
		.filter( isUsableImageBlock )
		.map( ( block ) => {
			const a = block.attributes ?? {};
			const id = Number( a.id ) > 0 ? Number( a.id ) : 0;
			const meta = attachmentMeta[ id ] ?? {};

			const coreAlt = 'string' === typeof a.alt ? a.alt : '';
			const coreCaption = 'string' === typeof a.caption ? a.caption : '';

			const entry = {
				id,
				// The preview reads these; render.php re-resolves from the
				// attachment unless an override below says otherwise.
				url: a.url ?? '',
				width: 0,
				height: 0,
				alt: coreAlt,
				caption: coreCaption,
				title: a.title ?? '',
				// `link` means the attachment permalink in this block. Core's
				// href is whatever the link destination resolved to, so it is
				// only the same thing when that destination is the attachment.
				link:
					'attachment' === a.linkDestination && a.href ? a.href : '',
				filename: '',
			};

			if ( shouldStoreOverride( coreAlt, meta.alt ) ) {
				entry.altOverride = coreAlt;
			}
			if ( shouldStoreOverride( coreCaption, meta.caption ) ) {
				entry.captionOverride = coreCaption;
			}
			if ( true === a.isDecorative ) {
				entry.isDecorative = true;
			}
			if ( a.linkTarget ) {
				entry.linkTarget = a.linkTarget;
			}
			if ( a.rel ) {
				entry.rel = a.rel;
			}

			return entry;
		} );

	// Core's imageCrop is a boolean; this block expresses the same idea as a
	// layout. Cropped squares are the grid; uncropped is masonry.
	const cropped = false !== attributes.imageCrop;

	return {
		...copySupportAttributes( attributes ),
		images,
		layout: cropped ? 'grid' : 'masonry',
		// Only the grid layout reads this; masonry sizes from the image. Set
		// to the square ratio either way so switching layout afterwards
		// behaves the way a cropped core gallery looked.
		aspectRatio: '1/1',
		columns: clampColumns( attributes.columns ),
		linkTo: linkToFromCore( attributes.linkTo ),
		thumbnailSize: attributes.sizeSlug || 'large',
		orderBy: true === attributes.randomOrder ? 'rand' : 'default',
		caption:
			'string' === typeof attributes.caption ? attributes.caption : '',
	};
}

/**
 * Convert this block's attributes back into a core/gallery.
 *
 * Returns plain data rather than blocks so it stays testable; src/index.js
 * feeds the result to createBlock().
 *
 * @param {Object} attributes ph/gallery-display attributes.
 * @return {{galleryAttributes: Object, imageBlockAttributes: Array}} Core data.
 */
export function displayToGallery( attributes = {} ) {
	const linkDestination = linkToToCore( attributes.linkTo );
	const sizeSlug = attributes.thumbnailSize || 'large';

	const imageBlockAttributes = ( attributes.images ?? [] ).map( ( img ) => {
		const out = {
			id: img.id,
			url: img.url ?? '',
			alt: img.altOverride ?? img.alt ?? '',
			caption: img.captionOverride ?? img.caption ?? '',
			sizeSlug,
			// Written on the image as well as the gallery: core's gallery
			// controls read the children, and setting only one of the two
			// leaves them disagreeing.
			linkDestination,
		};

		if ( 'attachment' === linkDestination && img.link ) {
			out.href = img.link;
		} else if ( 'media' === linkDestination && img.url ) {
			out.href = img.url;
		}

		if ( img.isDecorative ) {
			out.isDecorative = true;
		}
		if ( img.linkTarget ) {
			out.linkTarget = img.linkTarget;
		}
		if ( img.rel ) {
			out.rel = img.rel;
		}

		return out;
	} );

	return {
		galleryAttributes: {
			...copySupportAttributes( attributes ),
			columns: clampColumns( attributes.columns ),
			linkTo: linkDestination,
			sizeSlug,
			imageCrop: ! UNCROPPED_LAYOUTS.includes( attributes.layout ),
			randomOrder: 'rand' === attributes.orderBy,
			caption:
				'string' === typeof attributes.caption
					? attributes.caption
					: '',
		},
		imageBlockAttributes,
	};
}
