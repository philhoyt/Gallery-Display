/**
 * Tests for the editor preview document.
 *
 * buildPreviewDoc() output is handed to <iframe srcdoc>, which inherits the
 * parent's origin. Block attributes are read from post content and are not
 * validated by the block API, so anything that can save a post can put
 * arbitrary strings in them. These tests assert that a hostile attribute
 * cannot escape the markup it is interpolated into.
 */

import { buildPreviewDoc } from './preview-doc';

const PLUGIN_URL = 'https://example.test/wp-content/plugins/gallery-display/';

const BREAKOUT = '"><img src=x onerror=alert(1)>';

/**
 * Parse the generated document the way the iframe will.
 *
 * Breakout is a structural property, not a textual one — an escaped payload
 * still contains its own substrings, so asserting on those gives false
 * failures. Parse instead and ask whether anything became real markup.
 *
 * @param {string} doc Generated document.
 * @return {Document} Parsed document.
 */
function parse( doc ) {
	return new DOMParser().parseFromString( doc, 'text/html' );
}

/**
 * Every event-handler attribute present anywhere in a parsed document.
 *
 * @param {Document} parsed Parsed document.
 * @return {string[]} Attribute names.
 */
function eventHandlerAttributes( parsed ) {
	return Array.from( parsed.querySelectorAll( '*' ) ).flatMap( ( el ) =>
		Array.from( el.attributes )
			.map( ( a ) => a.name )
			.filter( ( name ) => name.startsWith( 'on' ) )
	);
}

function baseAttributes( overrides = {} ) {
	return {
		images: [
			{
				id: 1,
				url: 'https://example.test/image.jpg',
				width: 800,
				height: 600,
				alt: 'An image',
				caption: '',
				title: 'Image',
				link: 'https://example.test/image-page/',
				filename: 'image.jpg',
			},
		],
		layout: 'grid',
		linkTo: 'lightbox',
		columns: 3,
		aspectRatio: '1/1',
		rowHeight: 200,
		showCaption: false,
		captionPosition: 'below',
		...overrides,
	};
}

describe( 'buildPreviewDoc', () => {
	it( 'renders a document for well-formed attributes', () => {
		const doc = buildPreviewDoc( baseAttributes(), PLUGIN_URL );

		expect( doc ).toContain( '<!DOCTYPE html>' );
		expect( doc ).toContain( 'is-layout-grid' );
		expect( doc ).toContain( '--ph-gallery-ratio:1/1' );
		expect( doc ).toContain( 'data-columns="3"' );
	} );

	it.each( [
		[ 'layout', { layout: BREAKOUT } ],
		[ 'captionPosition', { captionPosition: BREAKOUT, showCaption: true } ],
		[ 'aspectRatio', { aspectRatio: BREAKOUT } ],
		[ 'columns', { columns: BREAKOUT } ],
		[ 'rowHeight', { rowHeight: BREAKOUT } ],
	] )( 'does not let a hostile %s escape its attribute', ( _name, override ) => {
		const parsed = parse(
			buildPreviewDoc( baseAttributes( override ), PLUGIN_URL )
		);

		expect( eventHandlerAttributes( parsed ) ).toEqual( [] );
		// One image in, one image out — nothing was injected.
		expect( parsed.querySelectorAll( 'img' ) ).toHaveLength( 1 );
	} );

	it( 'escapes hostile image fields', () => {
		const doc = buildPreviewDoc(
			baseAttributes( {
				images: [
					{
						id: 1,
						url: BREAKOUT,
						width: BREAKOUT,
						height: BREAKOUT,
						alt: BREAKOUT,
						caption: BREAKOUT,
						link: BREAKOUT,
						filename: BREAKOUT,
					},
				],
				showCaption: true,
			} ),
			PLUGIN_URL
		);
		const parsed = parse( doc );

		expect( eventHandlerAttributes( parsed ) ).toEqual( [] );
		expect( parsed.querySelectorAll( 'img' ) ).toHaveLength( 1 );
		// The payload survives as inert text inside the attribute value.
		expect( parsed.querySelector( 'img' ).getAttribute( 'alt' ) ).toBe(
			BREAKOUT
		);
	} );

	it( 'does not interpolate a hostile layout into an asset URL', () => {
		const doc = buildPreviewDoc(
			baseAttributes( { layout: '../../../evil' } ),
			PLUGIN_URL
		);

		expect( doc ).not.toContain( '../../../evil' );
		expect( doc ).toContain( 'build/styles/evil.css' );
	} );

	it( 'falls back to defaults for out-of-range numbers', () => {
		const doc = buildPreviewDoc(
			baseAttributes( { columns: 999, rowHeight: -10 } ),
			PLUGIN_URL
		);

		expect( doc ).toContain( 'data-columns="6"' );
		expect( doc ).toContain( 'data-row-height="80"' );
	} );

	it( 'keeps a layout registered by a companion plugin', () => {
		const doc = buildPreviewDoc(
			baseAttributes( { layout: 'my-carousel' } ),
			PLUGIN_URL
		);

		expect( doc ).toContain( 'is-layout-my-carousel' );
		expect( doc ).toContain( 'build/styles/my-carousel.css' );
	} );

	it( 'links to the attachment page when linkTo is attachment', () => {
		const doc = buildPreviewDoc(
			baseAttributes( { linkTo: 'attachment' } ),
			PLUGIN_URL
		);

		expect( doc ).toContain( 'href="https://example.test/image-page/"' );
	} );

	it( 'labels a link whose image has no alt text', () => {
		const doc = buildPreviewDoc(
			baseAttributes( {
				images: [
					{
						id: 1,
						url: 'https://example.test/image.jpg',
						width: 800,
						height: 600,
						alt: '',
						caption: '',
						title: '',
						filename: 'sunset.jpg',
					},
				],
			} ),
			PLUGIN_URL
		);

		expect( doc ).toContain( 'aria-label="sunset.jpg"' );
	} );
} );
