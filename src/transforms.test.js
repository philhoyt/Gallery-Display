/**
 * Tests for the core/gallery mapping.
 *
 * These cover the pure mappers. The wiring that hands them to the editor is
 * covered separately in block-transforms.test.js, so a correct mapper behind a
 * miswired transform cannot pass unnoticed.
 */

import {
	galleryToDisplay,
	displayToGallery,
	isUsableImageBlock,
	hasUsableImages,
	clampColumns,
	linkToFromCore,
	linkToToCore,
	shouldStoreOverride,
} from './transforms';

const image = ( attributes ) => ( {
	name: 'core/image',
	attributes,
	innerBlocks: [],
} );

const TWO_IMAGES = [
	image( {
		id: 11,
		url: 'https://example.test/one.jpg',
		alt: 'Alt one',
		caption: 'Cap one',
		sizeSlug: 'large',
		linkDestination: 'media',
		href: 'https://example.test/one-full.jpg',
	} ),
	image( {
		id: 12,
		url: 'https://example.test/two.jpg',
		alt: '',
		caption: '',
		sizeSlug: 'large',
		linkDestination: 'media',
	} ),
];

describe( 'galleryToDisplay', () => {
	it( 'maps images preserving id, order, alt and caption', () => {
		const out = galleryToDisplay( { columns: 3 }, TWO_IMAGES );

		expect( out.images ).toHaveLength( 2 );
		expect( out.images.map( ( i ) => i.id ) ).toEqual( [ 11, 12 ] );
		expect( out.images[ 0 ].alt ).toBe( 'Alt one' );
		expect( out.images[ 0 ].caption ).toBe( 'Cap one' );
	} );

	it( 'maps href to link only for an attachment destination', () => {
		const media = galleryToDisplay( {}, TWO_IMAGES );
		expect( media.images[ 0 ].link ).toBe( '' );

		const attachment = galleryToDisplay( {}, [
			image( {
				id: 11,
				url: 'https://example.test/one.jpg',
				linkDestination: 'attachment',
				href: 'https://example.test/one-page/',
			} ),
		] );
		expect( attachment.images[ 0 ].link ).toBe(
			'https://example.test/one-page/'
		);
	} );

	it( 'stores an override only when the value differs from the attachment', () => {
		const meta = { 11: { alt: 'Alt one', caption: 'Cap one' } };
		const same = galleryToDisplay( {}, TWO_IMAGES, meta );
		expect( same.images[ 0 ].altOverride ).toBeUndefined();
		expect( same.images[ 0 ].captionOverride ).toBeUndefined();

		const differing = galleryToDisplay( {}, TWO_IMAGES, {
			11: { alt: 'Different', caption: 'Different' },
		} );
		expect( differing.images[ 0 ].altOverride ).toBe( 'Alt one' );
		expect( differing.images[ 0 ].captionOverride ).toBe( 'Cap one' );
	} );

	it( 'stores an override when the attachment is unknown', () => {
		const out = galleryToDisplay( {}, TWO_IMAGES );
		expect( out.images[ 0 ].altOverride ).toBe( 'Alt one' );
		expect( out.images[ 0 ].captionOverride ).toBe( 'Cap one' );
	} );

	it( 'never stores an override for an empty value', () => {
		const out = galleryToDisplay( {}, TWO_IMAGES );
		expect( out.images[ 1 ].altOverride ).toBeUndefined();
		expect( out.images[ 1 ].captionOverride ).toBeUndefined();
	} );

	it( 'carries the decorative flag and link attributes', () => {
		const out = galleryToDisplay( {}, [
			image( {
				id: 11,
				url: 'https://example.test/one.jpg',
				isDecorative: true,
				linkTarget: '_blank',
				rel: 'nofollow',
			} ),
		] );
		expect( out.images[ 0 ].isDecorative ).toBe( true );
		expect( out.images[ 0 ].linkTarget ).toBe( '_blank' );
		expect( out.images[ 0 ].rel ).toBe( 'nofollow' );
	} );

	it( 'filters out non-image and unusable inner blocks', () => {
		const out = galleryToDisplay( {}, [
			{ name: 'core/paragraph', attributes: { content: 'x' } },
			image( {} ),
			TWO_IMAGES[ 0 ],
		] );
		expect( out.images ).toHaveLength( 1 );
		expect( out.images[ 0 ].id ).toBe( 11 );
	} );

	it( 'maps imageCrop to a layout', () => {
		expect( galleryToDisplay( { imageCrop: true }, [] ).layout ).toBe(
			'grid'
		);
		expect( galleryToDisplay( { imageCrop: false }, [] ).layout ).toBe(
			'masonry'
		);
		// Core leaves imageCrop undefined by default, meaning cropped.
		expect( galleryToDisplay( {}, [] ).layout ).toBe( 'grid' );
	} );

	it( 'maps randomOrder and sizeSlug', () => {
		expect( galleryToDisplay( { randomOrder: true }, [] ).orderBy ).toBe(
			'rand'
		);
		expect( galleryToDisplay( {}, [] ).orderBy ).toBe( 'default' );
		expect(
			galleryToDisplay( { sizeSlug: 'medium' }, [] ).thumbnailSize
		).toBe( 'medium' );
		expect( galleryToDisplay( {}, [] ).thumbnailSize ).toBe( 'large' );
	} );

	it( 'carries the gallery caption, anchor, align and support attributes', () => {
		const out = galleryToDisplay(
			{
				caption: 'A <strong>caption</strong>',
				anchor: 'my-gallery',
				align: 'center',
				className: 'custom-class',
				backgroundColor: 'primary',
				style: { spacing: { blockGap: '32px' } },
			},
			[]
		);

		expect( out.caption ).toBe( 'A <strong>caption</strong>' );
		expect( out.anchor ).toBe( 'my-gallery' );
		expect( out.align ).toBe( 'center' );
		expect( out.className ).toBe( 'custom-class' );
		expect( out.backgroundColor ).toBe( 'primary' );
		expect( out.style.spacing.blockGap ).toBe( '32px' );
	} );

	it( 'omits support attributes that were never set', () => {
		const out = galleryToDisplay( {}, [] );
		expect( out ).not.toHaveProperty( 'align' );
		expect( out ).not.toHaveProperty( 'anchor' );
		expect( out ).not.toHaveProperty( 'className' );
	} );
} );

describe( 'displayToGallery', () => {
	it( 'rebuilds image attributes with the link destination on both levels', () => {
		const { galleryAttributes, imageBlockAttributes } = displayToGallery( {
			images: [ { id: 11, url: 'https://example.test/one.jpg' } ],
			linkTo: 'media',
		} );

		expect( galleryAttributes.linkTo ).toBe( 'media' );
		expect( imageBlockAttributes[ 0 ].linkDestination ).toBe( 'media' );
		expect( imageBlockAttributes[ 0 ].href ).toBe(
			'https://example.test/one.jpg'
		);
	} );

	it( 'prefers an override when rebuilding alt and caption', () => {
		const { imageBlockAttributes } = displayToGallery( {
			images: [
				{
					id: 11,
					alt: 'from attachment',
					caption: 'from attachment',
					altOverride: 'authored',
					captionOverride: 'authored',
				},
			],
		} );
		expect( imageBlockAttributes[ 0 ].alt ).toBe( 'authored' );
		expect( imageBlockAttributes[ 0 ].caption ).toBe( 'authored' );
	} );

	it( 'collapses layout back to imageCrop', () => {
		expect(
			displayToGallery( { layout: 'grid' } ).galleryAttributes.imageCrop
		).toBe( true );
		[ 'masonry', 'justified', 'list' ].forEach( ( layout ) => {
			expect(
				displayToGallery( { layout } ).galleryAttributes.imageCrop
			).toBe( false );
		} );
	} );
} );

describe( 'linkTo mapping', () => {
	it( 'maps core values into this block', () => {
		expect( linkToFromCore( 'media' ) ).toBe( 'media' );
		expect( linkToFromCore( 'attachment' ) ).toBe( 'attachment' );
		expect( linkToFromCore( 'none' ) ).toBe( 'none' );
		// Core leaves linkTo undefined when links are off.
		expect( linkToFromCore( undefined ) ).toBe( 'none' );
		expect( linkToFromCore( 'nonsense' ) ).toBe( 'none' );
	} );

	it( 'maps back, turning lightbox into media', () => {
		expect( linkToToCore( 'lightbox' ) ).toBe( 'media' );
		expect( linkToToCore( 'media' ) ).toBe( 'media' );
		expect( linkToToCore( 'attachment' ) ).toBe( 'attachment' );
		expect( linkToToCore( 'none' ) ).toBe( 'none' );
		expect( linkToToCore( undefined ) ).toBe( 'none' );
	} );
} );

describe( 'clampColumns', () => {
	it( 'clamps to the range the control allows', () => {
		expect( clampColumns( 8 ) ).toBe( 6 );
		expect( clampColumns( 0 ) ).toBe( 1 );
		expect( clampColumns( 4 ) ).toBe( 4 );
	} );

	it( 'defaults to 3 when unset', () => {
		expect( clampColumns( undefined ) ).toBe( 3 );
		expect( clampColumns( null ) ).toBe( 3 );
	} );
} );

describe( 'isUsableImageBlock / hasUsableImages', () => {
	it( 'accepts an image with an id or a url', () => {
		expect( isUsableImageBlock( image( { id: 11 } ) ) ).toBe( true );
		expect(
			isUsableImageBlock( image( { url: 'https://x/y.jpg' } ) )
		).toBe( true );
	} );

	it( 'rejects other blocks and empty images', () => {
		expect( isUsableImageBlock( image( {} ) ) ).toBe( false );
		expect(
			isUsableImageBlock( { name: 'core/paragraph', attributes: {} } )
		).toBe( false );
		expect( isUsableImageBlock( null ) ).toBe( false );
	} );

	it( 'rejects a gallery with nothing usable', () => {
		expect( hasUsableImages( [] ) ).toBe( false );
		expect( hasUsableImages( [ image( {} ) ] ) ).toBe( false );
		expect( hasUsableImages( undefined ) ).toBe( false );
		expect( hasUsableImages( TWO_IMAGES ) ).toBe( true );
	} );
} );

describe( 'shouldStoreOverride', () => {
	it( 'stores nothing for an empty value', () => {
		expect( shouldStoreOverride( '', 'anything' ) ).toBe( false );
		expect( shouldStoreOverride( undefined, 'anything' ) ).toBe( false );
	} );

	it( 'stores when the attachment is unknown', () => {
		expect( shouldStoreOverride( 'text', undefined ) ).toBe( true );
	} );

	it( 'stores only when the values differ', () => {
		expect( shouldStoreOverride( 'same', 'same' ) ).toBe( false );
		expect( shouldStoreOverride( 'a', 'b' ) ).toBe( true );
	} );
} );

describe( 'round trip', () => {
	it( 'preserves ids, order, settings and supports', () => {
		const original = {
			columns: 4,
			linkTo: 'attachment',
			sizeSlug: 'medium',
			imageCrop: false,
			randomOrder: true,
			caption: 'Gallery caption',
			anchor: 'my-gallery',
			align: 'wide',
			className: 'custom',
			style: { spacing: { blockGap: '32px' } },
		};

		const display = galleryToDisplay( original, TWO_IMAGES );
		const { galleryAttributes, imageBlockAttributes } =
			displayToGallery( display );

		expect( imageBlockAttributes.map( ( i ) => i.id ) ).toEqual( [
			11, 12,
		] );
		expect( galleryAttributes.columns ).toBe( 4 );
		expect( galleryAttributes.linkTo ).toBe( 'attachment' );
		expect( galleryAttributes.sizeSlug ).toBe( 'medium' );
		expect( galleryAttributes.imageCrop ).toBe( false );
		expect( galleryAttributes.randomOrder ).toBe( true );
		expect( galleryAttributes.caption ).toBe( 'Gallery caption' );
		expect( galleryAttributes.anchor ).toBe( 'my-gallery' );
		expect( galleryAttributes.align ).toBe( 'wide' );
		expect( galleryAttributes.className ).toBe( 'custom' );
		expect( galleryAttributes.style.spacing.blockGap ).toBe( '32px' );
		expect( imageBlockAttributes[ 0 ].alt ).toBe( 'Alt one' );
		expect( imageBlockAttributes[ 0 ].caption ).toBe( 'Cap one' );
	} );
} );
