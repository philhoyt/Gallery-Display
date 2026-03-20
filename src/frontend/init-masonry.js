/**
 * Masonry layout initializer.
 *
 * Reads window.IsotopeLib (set by isotope.js, registered as a dependency)
 * and initialises Isotope masonry on every masonry gallery on the page.
 * Re-layouts after each image loads to correct heights when images are
 * not yet in the browser cache.
 */

function getGapPx( el ) {
	const raw = getComputedStyle( el ).getPropertyValue( '--ph-gallery-gap' ).trim();
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

document.addEventListener( 'DOMContentLoaded', () => {
	const Isotope = window.IsotopeLib; // eslint-disable-line no-undef
	if ( ! Isotope ) {
		return;
	}

	document
		.querySelectorAll( '.wp-block-ph-gallery-display[data-layout="masonry"]' )
		.forEach( ( gallery ) => {
			const gap          = getGapPx( gallery );
			const columns      = parseInt( gallery.dataset.columns, 10 ) || 3;
			const containerWidth = gallery.offsetWidth;
			const cellWidth    = ( containerWidth - ( columns - 1 ) * gap ) / columns;

			gallery.querySelectorAll( '.ph-gallery-item' ).forEach( ( item ) => {
				item.style.width        = cellWidth + 'px';
				item.style.marginBottom = gap + 'px';
			} );

			const iso = new Isotope( gallery, {
				itemSelector: '.ph-gallery-item',
				layoutMode:   'masonry',
				masonry: {
					columnWidth: cellWidth,
					gutter:      gap,
				},
			} );

			gallery.querySelectorAll( 'img' ).forEach( ( img ) => {
				if ( img.complete ) {
					return;
				}
				img.addEventListener( 'load', () => iso.layout(), { once: true } );
			} );
		} );
} );
