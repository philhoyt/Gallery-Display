import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';

/**
 * Opens the media library in gallery mode and maps selections to the
 * { id, url, width, height, alt, caption } shape used by the block.
 *
 * width / height / alt / caption are stored so the editor JS render can
 * show real layout previews (Isotope, justified-layout) without a server
 * round-trip. render.php re-fetches all metadata at render time so the
 * stored values here are editor-only conveniences.
 *
 * URL preference: medium → thumbnail → original.
 *
 * @param {Object}   props
 * @param {Array}    props.images      Current images array.
 * @param {Function} props.onSelect    Called with the updated images array.
 * @param {string}   props.buttonLabel Button label text.
 */
export default function MediaSelector( { images, onSelect, buttonLabel } ) {
	const currentIds = ( images || [] ).map( ( img ) => img.id );

	function handleSelect( media ) {
		const selected = Array.isArray( media ) ? media : [ media ];
		const mapped = selected.map( ( m ) => {
			const size =
				m.sizes?.medium ??
				m.sizes?.thumbnail ??
				null;

			return {
				id:      m.id,
				url:     size?.url    ?? m.url,
				width:   size?.width  ?? m.width  ?? 0,
				height:  size?.height ?? m.height ?? 0,
				alt:     m.alt     ?? '',
				caption: m.caption ?? '',
			};
		} );
		onSelect( mapped );
	}

	return (
		<MediaUploadCheck>
			<MediaUpload
				onSelect={ handleSelect }
				allowedTypes={ [ 'image' ] }
				multiple
				gallery
				value={ currentIds }
				render={ ( { open } ) => (
					<Button onClick={ open } variant="secondary">
						{ buttonLabel }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}
