/**
 * Attribute sanitizers for the editor preview document.
 *
 * buildPreviewDoc() in edit.js assembles a raw HTML string that is handed to
 * an <iframe srcdoc>. A srcdoc iframe inherits the parent's origin, so any
 * unescaped block attribute in that string is script execution in wp-admin.
 * Block attributes are read from post content and are not validated by the
 * block API, so a low-privilege user can store whatever they like in them.
 *
 * Everything interpolated into the preview document goes through one of these.
 */

/**
 * Escape a value for use inside a double-quoted HTML attribute.
 *
 * @param {*} val Raw value.
 * @return {string} Escaped string.
 */
export function esc( val ) {
	return String( val ?? '' )
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

/**
 * Reduce a value to a bare CSS identifier token, for use in a class name,
 * a data attribute, or a file path segment.
 *
 * Layouts are extensible through the `galleryDisplay.layouts` filter, so this
 * deliberately does not check against a fixed list — it strips anything that
 * could not appear in a class name instead.
 *
 * @param {*}      value    Raw value.
 * @param {string} fallback Value to use when nothing survives.
 * @return {string} A safe identifier.
 */
export function cssIdent( value, fallback ) {
	const cleaned = String( value ?? '' ).replace( /[^a-zA-Z0-9_-]/g, '' );
	return cleaned || fallback;
}

/**
 * Validate a CSS aspect-ratio value such as "16/9".
 *
 * @param {*}      value    Raw value.
 * @param {string} fallback Value to use when the input is not a ratio.
 * @return {string} A safe ratio.
 */
export function cssRatio( value, fallback ) {
	const raw = String( value ?? '' ).trim();
	return /^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test( raw ) ? raw : fallback;
}

/**
 * Coerce a value to an integer clamped to a range.
 *
 * @param {*}      value    Raw value.
 * @param {number} fallback Value to use when the input is not a number.
 * @param {number} min      Lower bound, inclusive.
 * @param {number} max      Upper bound, inclusive.
 * @return {number} A safe integer.
 */
export function intInRange( value, fallback, min, max ) {
	const n = Number.parseInt( value, 10 );
	if ( ! Number.isFinite( n ) ) {
		return fallback;
	}
	return Math.min( Math.max( n, min ), max );
}

// Tags the gallery caption may contain. Deliberately narrow: a caption needs
// emphasis and links, nothing more. render.php filters the same value with
// wp_kses_post(), which is broader, so anything allowed here is allowed there.
const CAPTION_ALLOWED_TAGS = new Set( [ 'A', 'B', 'STRONG', 'I', 'EM', 'BR' ] );

// Removed with their contents rather than unwrapped — their text is markup,
// not caption prose.
const CAPTION_DROP_TAGS = new Set( [
	'SCRIPT',
	'STYLE',
	'IFRAME',
	'OBJECT',
	'EMBED',
	'TEMPLATE',
] );

/**
 * Whether an href is safe to keep on a caption link.
 *
 * @param {string} value Raw href.
 * @return {boolean} True when the scheme is allowed.
 */
function isSafeHref( value ) {
	// Strip control characters first: "java\u0000script:" and friends are
	// otherwise re-joined by the browser after this check.
	const raw = String( value ?? '' )
		.replace( /[\u0000-\u0020]/g, '' )
		.trim();

	if ( '' === raw ) {
		return false;
	}
	// Anything carrying an explicit scheme must be one we allow.
	if ( /^[a-z][a-z0-9+.-]*:/i.test( raw ) ) {
		return /^(?:https?|mailto|tel):/i.test( raw );
	}
	// Relative URLs and fragments are fine.
	return true;
}

/**
 * Recursively reduce a parsed fragment to the allowed caption subset.
 *
 * @param {Node} node Parent node whose children are sanitized in place.
 */
function sanitizeCaptionNode( node ) {
	Array.from( node.childNodes ).forEach( ( child ) => {
		// Text nodes are already inert.
		if ( 3 === child.nodeType ) {
			return;
		}
		// Comments, CDATA and anything else that is not an element.
		if ( 1 !== child.nodeType ) {
			child.remove();
			return;
		}

		if ( CAPTION_DROP_TAGS.has( child.tagName ) ) {
			child.remove();
			return;
		}

		sanitizeCaptionNode( child );

		if ( ! CAPTION_ALLOWED_TAGS.has( child.tagName ) ) {
			// Unwrap: keep the text the author wrote, drop the element.
			while ( child.firstChild ) {
				node.insertBefore( child.firstChild, child );
			}
			child.remove();
			return;
		}

		Array.from( child.attributes ).forEach( ( attr ) => {
			const keep =
				'A' === child.tagName &&
				'href' === attr.name.toLowerCase() &&
				isSafeHref( attr.value );
			if ( ! keep ) {
				child.removeAttribute( attr.name );
			}
		} );
	} );
}

/**
 * Sanitize the gallery caption for the preview document.
 *
 * The caption is rich text, so escaping it as plain text would show tags to
 * the user and make the preview disagree with the front end. Passing it
 * through untouched would reopen the injection path this module exists to
 * close. Parsing into an inert document and keeping an allowlist does neither.
 *
 * @param {*} html Raw caption HTML.
 * @return {string} Sanitized HTML.
 */
export function sanitizeCaption( html ) {
	const raw = String( html ?? '' );
	if ( '' === raw.trim() ) {
		return '';
	}
	// DOMParser produces an inert document: no scripts run, no images load.
	const doc = new DOMParser().parseFromString(
		'<body>' + raw + '</body>',
		'text/html'
	);
	sanitizeCaptionNode( doc.body );
	return doc.body.innerHTML;
}

/**
 * Validate a CSS length, or the var(--wp--…) form produced from a WordPress
 * spacing preset.
 *
 * @param {*}      value    Raw value.
 * @param {string} fallback Value to use when the input is not a length.
 * @return {string} A safe CSS length.
 */
export function cssLength( value, fallback ) {
	const raw = String( value ?? '' ).trim();
	if ( /^\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh)$/.test( raw ) ) {
		return raw;
	}
	if ( /^var\(--wp--[a-zA-Z0-9-]+\)$/.test( raw ) ) {
		return raw;
	}
	return fallback;
}
