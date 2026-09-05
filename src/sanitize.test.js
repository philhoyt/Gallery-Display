/**
 * Unit tests for the preview-document sanitizers.
 */

import { esc, cssIdent, cssRatio, cssLength, intInRange } from './sanitize';

describe( 'esc', () => {
	it( 'escapes the characters that can break out of an attribute', () => {
		expect( esc( '"><script>alert(1)</script>' ) ).toBe(
			'&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;'
		);
	} );

	it( 'escapes ampersands before the entities it introduces', () => {
		expect( esc( '&quot;' ) ).toBe( '&amp;quot;' );
	} );

	it( 'renders null and undefined as an empty string', () => {
		expect( esc( null ) ).toBe( '' );
		expect( esc( undefined ) ).toBe( '' );
	} );

	it( 'stringifies non-string input', () => {
		expect( esc( 42 ) ).toBe( '42' );
	} );
} );

describe( 'cssIdent', () => {
	it( 'passes through a plain identifier', () => {
		expect( cssIdent( 'masonry', 'grid' ) ).toBe( 'masonry' );
	} );

	it( 'keeps identifiers a companion plugin might register', () => {
		expect( cssIdent( 'my_plugin-carousel2', 'grid' ) ).toBe(
			'my_plugin-carousel2'
		);
	} );

	it( 'strips characters that could escape a class attribute', () => {
		expect( cssIdent( 'grid" onload="alert(1)', 'grid' ) ).toBe(
			'gridonloadalert1'
		);
	} );

	it( 'falls back when nothing survives', () => {
		expect( cssIdent( '"><img src=x>', 'grid' ) ).toBe( 'imgsrcx' );
		expect( cssIdent( '', 'grid' ) ).toBe( 'grid' );
		expect( cssIdent( null, 'grid' ) ).toBe( 'grid' );
	} );
} );

describe( 'cssRatio', () => {
	it( 'accepts valid ratios', () => {
		expect( cssRatio( '16/9', '1/1' ) ).toBe( '16/9' );
		expect( cssRatio( '1.5/1', '1/1' ) ).toBe( '1.5/1' );
		expect( cssRatio( ' 4 / 3 ', '1/1' ) ).toBe( '4 / 3' );
	} );

	it( 'rejects an appended CSS declaration', () => {
		expect(
			cssRatio( '1/1;background:url(https://evil.example/x)', '1/1' )
		).toBe( '1/1' );
	} );

	it( 'rejects anything that is not a ratio', () => {
		expect( cssRatio( 'auto', '1/1' ) ).toBe( '1/1' );
		expect( cssRatio( '', '1/1' ) ).toBe( '1/1' );
	} );
} );

describe( 'cssLength', () => {
	it( 'accepts CSS lengths', () => {
		expect( cssLength( '24px', '16px' ) ).toBe( '24px' );
		expect( cssLength( '1.5rem', '16px' ) ).toBe( '1.5rem' );
	} );

	it( 'accepts a WordPress preset custom property', () => {
		expect( cssLength( 'var(--wp--preset--spacing--80)', '16px' ) ).toBe(
			'var(--wp--preset--spacing--80)'
		);
	} );

	it( 'rejects an arbitrary custom property or function call', () => {
		expect( cssLength( 'var(--evil)', '16px' ) ).toBe( '16px' );
		expect( cssLength( 'url(https://evil.example/x)', '16px' ) ).toBe(
			'16px'
		);
	} );

	it( 'rejects an appended declaration', () => {
		expect( cssLength( '16px;color:red', '16px' ) ).toBe( '16px' );
	} );
} );

describe( 'intInRange', () => {
	it( 'clamps to the range', () => {
		expect( intInRange( 99, 3, 1, 6 ) ).toBe( 6 );
		expect( intInRange( -5, 3, 1, 6 ) ).toBe( 1 );
		expect( intInRange( 4, 3, 1, 6 ) ).toBe( 4 );
	} );

	it( 'falls back on values that are not numbers', () => {
		expect( intInRange( 'abc', 3, 1, 6 ) ).toBe( 3 );
		expect( intInRange( null, 3, 1, 6 ) ).toBe( 3 );
		expect( intInRange( undefined, 3, 1, 6 ) ).toBe( 3 );
	} );

	it( 'drops a payload trailing a number', () => {
		expect( intInRange( '3"><script>', 3, 1, 6 ) ).toBe( 3 );
	} );
} );
