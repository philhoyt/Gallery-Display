/**
 * Mosaic layout initializer.
 *
 * Uses Isotope packery mode. Large items (.ph-gallery-item--large) span two
 * columns; all others span one. Computes explicit pixel widths from data
 * attributes and recomputes them whenever the gallery's width changes — the
 * widths are fixed pixel values, so without that the layout keeps its
 * load-time size when the viewport is resized.
 */

import { getGapPx, onWidthChange } from './gap';

document.addEventListener( 'DOMContentLoaded', () => {
	const Isotope = window.IsotopeLib;
	if ( ! Isotope ) {
		return;
	}

	document
		.querySelectorAll(
			'.wp-block-ph-gallery-display[data-layout="mosaic"]'
		)
		.forEach( ( gallery ) => {
			const gap = getGapPx( gallery );
			const columns = parseInt( gallery.dataset.columns, 10 ) || 3;
			const items = gallery.querySelectorAll( '.ph-gallery-item' );

			function cellWidth() {
				const containerWidth = gallery.offsetWidth;
				return ( containerWidth - ( columns - 1 ) * gap ) / columns;
			}

			function sizeItems( width ) {
				items.forEach( ( item ) => {
					const isLarge = item.classList.contains(
						'ph-gallery-item--large'
					);
					item.style.width = isLarge
						? width * 2 + gap + 'px'
						: width + 'px';
					item.style.marginBottom = gap + 'px';
				} );
			}

			sizeItems( cellWidth() );

			const iso = new Isotope( gallery, {
				itemSelector: '.ph-gallery-item',
				layoutMode: 'packery',
				packery: {
					gutter: gap,
				},
			} );

			onWidthChange( gallery, () => {
				const width = cellWidth();
				if ( width <= 0 ) {
					return;
				}
				sizeItems( width );
				iso.layout();
			} );

			gallery.querySelectorAll( 'img' ).forEach( ( img ) => {
				if ( img.complete ) {
					return;
				}
				img.addEventListener( 'load', () => iso.layout(), {
					once: true,
				} );
			} );
		} );
} );
