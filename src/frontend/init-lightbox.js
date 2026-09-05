/**
 * PhotoSwipe v5 lightbox initializer.
 *
 * Imports PhotoSwipe and its default styles directly — no window global,
 * no dynamic import. Passing the PhotoSwipe class to pswpModule is the
 * recommended pattern for bundled (non-CDN) usage in PhotoSwipe v5.
 *
 * The CSS import is extracted by MiniCssExtractPlugin into
 * build/frontend/init-lightbox.css, which render.php enqueues alongside
 * this script when linkTo === 'lightbox'.
 */

import 'photoswipe/dist/photoswipe.css';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';

document.addEventListener( 'DOMContentLoaded', () => {
	document
		.querySelectorAll(
			'.wp-block-ph-gallery-display[data-link-to="lightbox"]'
		)
		.forEach( ( gallery ) => {
			const lightbox = new PhotoSwipeLightbox( {
				gallery,
				children: 'a.ph-gallery-item__link',
				pswpModule: PhotoSwipe,
			} );

			lightbox.init();
		} );
} );
