/**
 * Tests for the transforms wiring itself, not just the mappers underneath it.
 *
 * A correct mapper behind a miswired transform still ships a broken feature —
 * wrong argument order, isMatch reading the wrong thing, inner blocks never
 * reaching createBlock. These call the registered callbacks directly with a
 * stub createBlock, so that wiring is covered without installing the
 * wp.blocks package, which is a runtime external.
 */

import { makeTransforms } from './block-transforms';

const BLOCK_NAME = 'ph/gallery-display';

// Stands in for createBlock, recording what it was asked to build.
const createBlock = ( name, attributes, innerBlocks = [] ) => ( {
	name,
	attributes,
	innerBlocks,
} );

const image = ( attributes ) => ( { name: 'core/image', attributes } );

const GALLERY_INNER = [
	image( { id: 11, url: 'https://example.test/one.jpg', alt: 'One' } ),
	image( { id: 12, url: 'https://example.test/two.jpg', alt: 'Two' } ),
];

function build( readAttachmentMeta ) {
	return makeTransforms( {
		createBlock,
		blockName: BLOCK_NAME,
		readAttachmentMeta,
	} );
}

describe( 'transforms wiring', () => {
	it( 'registers a from and a to transform against core/gallery', () => {
		const t = build();

		expect( t.from ).toHaveLength( 1 );
		expect( t.to ).toHaveLength( 1 );
		expect( t.from[ 0 ].type ).toBe( 'block' );
		expect( t.from[ 0 ].blocks ).toEqual( [ 'core/gallery' ] );
		expect( t.to[ 0 ].blocks ).toEqual( [ 'core/gallery' ] );
	} );

	it( 'isMatch reads innerBlocks off the second argument', () => {
		const { isMatch } = build().from[ 0 ];

		// isMatch( attributes, block ) — the gallery's own attributes say
		// nothing about whether it holds images.
		expect( isMatch( {}, { innerBlocks: GALLERY_INNER } ) ).toBe( true );
		expect( isMatch( {}, { innerBlocks: [] } ) ).toBe( false );
		expect( isMatch( {}, {} ) ).toBe( false );
		expect( isMatch( {}, undefined ) ).toBe( false );
	} );

	it( 'the from transform builds this block from the inner images', () => {
		const { transform } = build().from[ 0 ];

		const block = transform( { columns: 4 }, GALLERY_INNER );

		expect( block.name ).toBe( BLOCK_NAME );
		expect( block.attributes.images.map( ( i ) => i.id ) ).toEqual( [
			11, 12,
		] );
		expect( block.attributes.columns ).toBe( 4 );
	} );

	it( 'the from transform passes the inner blocks to the metadata lookup', () => {
		const readAttachmentMeta = jest.fn( () => ( {
			11: { alt: 'One', caption: '' },
		} ) );
		const { transform } = build( readAttachmentMeta ).from[ 0 ];

		const block = transform( {}, GALLERY_INNER );

		expect( readAttachmentMeta ).toHaveBeenCalledWith( GALLERY_INNER );
		// Alt matches the attachment, so no override is stored.
		expect( block.attributes.images[ 0 ].altOverride ).toBeUndefined();
		// Second image was not in the map, so its alt is preserved.
		expect( block.attributes.images[ 1 ].altOverride ).toBe( 'Two' );
	} );

	it( 'survives a metadata lookup that returns nothing', () => {
		const { transform } = build( () => ( {} ) ).from[ 0 ];
		expect( () => transform( {}, GALLERY_INNER ) ).not.toThrow();
	} );

	it( 'the to transform builds a gallery with one image block per image', () => {
		const { transform } = build().to[ 0 ];

		const gallery = transform( {
			images: [
				{ id: 11, url: 'https://example.test/one.jpg', alt: 'One' },
				{ id: 12, url: 'https://example.test/two.jpg', alt: 'Two' },
			],
			linkTo: 'lightbox',
			columns: 3,
		} );

		expect( gallery.name ).toBe( 'core/gallery' );
		expect( gallery.innerBlocks ).toHaveLength( 2 );
		expect( gallery.innerBlocks[ 0 ].name ).toBe( 'core/image' );
		expect( gallery.innerBlocks.map( ( b ) => b.attributes.id ) ).toEqual( [
			11, 12,
		] );
		// lightbox has no core equivalent and becomes media, on both levels.
		expect( gallery.attributes.linkTo ).toBe( 'media' );
		expect( gallery.innerBlocks[ 0 ].attributes.linkDestination ).toBe(
			'media'
		);
	} );

	it( 'the to transform produces a gallery with no images for an empty block', () => {
		const { transform } = build().to[ 0 ];
		const gallery = transform( { images: [] } );
		expect( gallery.innerBlocks ).toHaveLength( 0 );
	} );
} );
