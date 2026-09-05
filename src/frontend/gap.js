/**
 * Shared gap measurement for the layout initializers.
 *
 * render.php writes the block's gap into the --ph-gallery-gap custom property,
 * which may be any CSS length or a var(--wp--preset--spacing--*) reference.
 * Isotope and justified-layout both need a plain pixel number, so measure it
 * by laying out a throwaway element and reading its width back.
 *
 * @param {Element} el Gallery element to read the custom property from.
 * @return {number} The gap in pixels.
 */
export function getGapPx( el ) {
	const raw = getComputedStyle( el )
		.getPropertyValue( '--ph-gallery-gap' )
		.trim();
	if ( ! raw ) {
		return 16;
	}
	const tmp = document.createElement( 'div' );
	tmp.style.cssText = 'position:absolute;visibility:hidden;width:' + raw;
	document.documentElement.appendChild( tmp );
	const px = tmp.offsetWidth;
	document.documentElement.removeChild( tmp );
	return px;
}

/**
 * Re-run a layout callback whenever the gallery's width changes.
 *
 * Layout modes that write fixed pixel widths onto items have to recompute on
 * resize or the items keep their load-time width. Width is compared explicitly
 * because the layouts themselves change the container's height, which would
 * otherwise re-enter the observer on every pass.
 *
 * @param {Element}  el     Gallery element to observe.
 * @param {Function} onSize Called when the observed width changes.
 */
export function onWidthChange( el, onSize ) {
	if ( typeof ResizeObserver === 'undefined' ) {
		return;
	}
	let lastWidth = el.offsetWidth;
	const ro = new ResizeObserver( () => {
		const newWidth = el.offsetWidth;
		if ( newWidth !== lastWidth ) {
			lastWidth = newWidth;
			onSize();
		}
	} );
	ro.observe( el );
}
