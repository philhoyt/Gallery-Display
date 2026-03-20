/**
 * Mosaic layout initializer.
 *
 * Uses Isotope packery mode. Large items (.ph-gallery-item--large) span two
 * columns; all others span one. Computes explicit pixel widths from data
 * attributes and passes them to Isotope.
 */

function getGapPx( el ) {
	const raw = getComputedStyle( el ).getPropertyValue( '--wp--style--block-gap' ).trim();
	if ( ! raw ) {
		return 16;
	}
	const tmp = document.createElement( 'div' );
	tmp.style.cssText = 'position:absolute;visibility:hidden;width:' + raw;
	document.documentElement.appendChild( tmp );
	const px = tmp.offsetWidth || 16;
	document.documentElement.removeChild( tmp );
	return px;
}

document.addEventListener( 'DOMContentLoaded', () => {
	const Isotope = window.IsotopeLib; // eslint-disable-line no-undef
	if ( ! Isotope ) {
		return;
	}

	document
		.querySelectorAll( '.wp-block-ph-gallery-display[data-layout="mosaic"]' )
		.forEach( ( gallery ) => {
			const gap          = getGapPx( gallery );
			const columns      = parseInt( gallery.dataset.columns, 10 ) || 3;
			const containerWidth = gallery.offsetWidth;
			const cellWidth    = ( containerWidth - ( columns - 1 ) * gap ) / columns;

			gallery.querySelectorAll( '.ph-gallery-item' ).forEach( ( item ) => {
				const isLarge       = item.classList.contains( 'ph-gallery-item--large' );
				item.style.width        = isLarge ? cellWidth * 2 + gap + 'px' : cellWidth + 'px';
				item.style.marginBottom = gap + 'px';
			} );

			const iso = new Isotope( gallery, {
				itemSelector: '.ph-gallery-item',
				layoutMode:   'packery',
				packery: {
					gutter: gap,
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
