/**
 * Justified layout initializer.
 *
 * Reads natural image dimensions from data-width / data-height attributes
 * set by render.php, calls justifiedLayout() to get box geometry, then applies
 * absolute positioning to every item. Re-calculates on container resize via
 * ResizeObserver so the layout stays correct when the browser is resized or
 * the content area width changes (e.g. editor sidebar open/close).
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
	const justifiedLayout = window.JustifiedLayoutLib; // eslint-disable-line no-undef
	if ( ! justifiedLayout ) {
		return;
	}

	document
		.querySelectorAll( '.wp-block-ph-gallery-display[data-layout="justified"]' )
		.forEach( ( gallery ) => {
			const rowHeight = parseInt( gallery.dataset.rowHeight, 10 ) || 200;
			const gap       = getGapPx( gallery );
			const items     = Array.from( gallery.querySelectorAll( '.ph-gallery-item' ) );

			function applyLayout() {
				const containerWidth = gallery.offsetWidth;
				if ( ! containerWidth ) {
					return;
				}

				const ratios = items.map( ( item ) => {
					const img = item.querySelector( 'img' );
					const w   = parseInt( img?.dataset.width, 10 );
					const h   = parseInt( img?.dataset.height, 10 );
					return w && h ? w / h : 3 / 2;
				} );

				const result = justifiedLayout( ratios, {
					containerWidth,
					targetRowHeight:  rowHeight,
					boxSpacing:       gap,
					containerPadding: 0,
				} );

				gallery.style.position = 'relative';
				gallery.style.height   = result.containerHeight + 'px';

				items.forEach( ( item, i ) => {
					const box = result.boxes[ i ];
					Object.assign( item.style, {
						position: 'absolute',
						top:      box.top    + 'px',
						left:     box.left   + 'px',
						width:    box.width  + 'px',
						height:   box.height + 'px',
					} );

					const img = item.querySelector( 'img' );
					if ( img ) {
						img.style.width     = '100%';
						img.style.height    = '100%';
						img.style.objectFit = 'cover';
					}
				} );
			}

			applyLayout();

			if ( typeof ResizeObserver !== 'undefined' ) {
				let lastWidth = gallery.offsetWidth;
				const ro = new ResizeObserver( () => {
					const newWidth = gallery.offsetWidth;
					if ( newWidth !== lastWidth ) {
						lastWidth = newWidth;
						applyLayout();
					}
				} );
				ro.observe( gallery );
			}
		} );
} );
