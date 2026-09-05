/**
 * Masonry layout initializer.
 *
 * Reads window.IsotopeLib (set by isotope.js, registered as a dependency)
 * and initialises Isotope masonry on every masonry gallery on the page.
 * Re-layouts after each image loads to correct heights when images are
 * not yet in the browser cache, and again whenever the gallery's width
 * changes — item widths are written as fixed pixel values, so they would
 * otherwise keep their load-time size when the viewport is resized.
 */

import { getGapPx, onWidthChange } from './gap';

document.addEventListener( 'DOMContentLoaded', () => {
	const Isotope = window.IsotopeLib;
	if ( ! Isotope ) {
		return;
	}

	document
		.querySelectorAll(
			'.wp-block-ph-gallery-display[data-layout="masonry"]'
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
					item.style.width = width + 'px';
					item.style.marginBottom = gap + 'px';
				} );
			}

			sizeItems( cellWidth() );

			// columnWidth is deliberately left unset: Isotope then derives it
			// from the first item's outer width, which sizeItems() keeps
			// current. Pinning it to a number here would make it stale on
			// resize, and Isotope has no supported way to update it after init.
			const iso = new Isotope( gallery, {
				itemSelector: '.ph-gallery-item',
				layoutMode: 'masonry',
				masonry: {
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
