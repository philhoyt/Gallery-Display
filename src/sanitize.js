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
