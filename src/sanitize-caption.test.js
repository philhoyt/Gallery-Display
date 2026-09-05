/**
 * Tests for the gallery caption sanitizer.
 *
 * The caption is rich text, so it cannot simply be escaped the way every other
 * value reaching the preview document is — escaping would show tags to the user
 * and make the preview disagree with what render.php outputs. That means this
 * is the one place where markup is deliberately allowed into the srcdoc
 * document, and it is held to the same standard as the rest of sanitize.js.
 */

import { sanitizeCaption } from './sanitize';

// Built rather than written literally so the file contains no raw control
// character. Browsers strip these from an href before resolving the scheme,
// which is what makes them a bypass worth testing.
const OBFUSCATED_JS_HREF =
	'java' + String.fromCharCode( 1 ) + 'script:alert(1)';

describe( 'sanitizeCaption', () => {
	it( 'keeps the allowed formatting tags', () => {
		expect(
			sanitizeCaption(
				'A <strong>bold</strong> and <em>italic</em> caption'
			)
		).toBe( 'A <strong>bold</strong> and <em>italic</em> caption' );
		expect( sanitizeCaption( 'line<br>break' ) ).toBe( 'line<br>break' );
	} );

	it( 'keeps a safe link and its href', () => {
		expect(
			sanitizeCaption( '<a href="https://example.test/">x</a>' )
		).toBe( '<a href="https://example.test/">x</a>' );
		expect( sanitizeCaption( '<a href="/relative">x</a>' ) ).toBe(
			'<a href="/relative">x</a>'
		);
	} );

	it( 'drops a javascript: href but keeps the link text', () => {
		const out = sanitizeCaption(
			'<a href="javascript:alert(1)">click</a>'
		);
		expect( out ).not.toContain( 'javascript' );
		expect( out ).toContain( 'click' );
	} );

	it( 'drops a control-character obfuscated javascript: href', () => {
		const out = sanitizeCaption(
			'<a href="' + OBFUSCATED_JS_HREF + '">click</a>'
		);
		expect( out ).not.toContain( 'href' );
		expect( out ).toContain( 'click' );
	} );

	it( 'strips every attribute other than a safe href', () => {
		const out = sanitizeCaption(
			'<a href="https://example.test/" onclick="alert(1)" class="x">y</a>'
		);
		expect( out ).not.toContain( 'onclick' );
		expect( out ).not.toContain( 'class' );
		expect( out ).toContain( 'href="https://example.test/"' );
	} );

	it( 'unwraps disallowed tags but keeps their text', () => {
		expect( sanitizeCaption( '<div>kept</div>' ) ).toBe( 'kept' );
		expect( sanitizeCaption( '<span class="x">kept</span>' ) ).toBe(
			'kept'
		);
	} );

	it( 'removes script and style entirely, contents included', () => {
		expect( sanitizeCaption( '<script>alert(1)</script>ok' ) ).toBe( 'ok' );
		expect( sanitizeCaption( '<style>body{}</style>ok' ) ).toBe( 'ok' );
	} );

	it( 'neutralises the breakout payload used in the preview-doc tests', () => {
		const out = sanitizeCaption( '"><img src=x onerror=alert(1)>' );
		expect( out ).not.toContain( 'onerror' );
		expect( out ).not.toContain( '<img' );
	} );

	it( 'strips event handlers from otherwise allowed tags', () => {
		const out = sanitizeCaption(
			'<strong onmouseover="alert(1)">hi</strong>'
		);
		expect( out ).toBe( '<strong>hi</strong>' );
	} );

	it( 'returns an empty string for empty input', () => {
		expect( sanitizeCaption( '' ) ).toBe( '' );
		expect( sanitizeCaption( null ) ).toBe( '' );
		expect( sanitizeCaption( '   ' ) ).toBe( '' );
	} );
} );
