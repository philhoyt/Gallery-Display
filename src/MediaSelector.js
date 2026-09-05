import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';

/**
 * Opens the media library in gallery mode and maps selections to the
 * { id, url, width, height, alt, caption, title, link, filename } shape
 * used by the block.
 *
 * An entry may also carry these optional fields, which the media library never
 * sets but a transform from core/gallery can. render.php prefers them over the
 * attachment's own values:
 *
 *   altOverride     {string}  alt text authored on the block, not the attachment
 *   captionOverride {string}  caption authored on the block
 *   isDecorative    {boolean} force alt="" — the image is decorative on purpose
 *   linkTarget      {string}  link target, e.g. "_blank"
 *   rel             {string}  link rel tokens
 *
 * Leaving them unset is what keeps the default behaviour: metadata is re-read
 * from the media library at render time, so editing an attachment updates every
 * gallery it appears in.
 *
 * Everything but `id` is stored so the editor preview can show real layout
 * previews (Isotope, justified-layout), attachment links, and accessible
 * link names without a server round-trip. render.php re-fetches all metadata
 * at render time, so the stored values here are editor-only conveniences.
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
			const size = m.sizes?.medium ?? m.sizes?.thumbnail ?? null;

			return {
				id: m.id,
				url: size?.url ?? m.url,
				width: size?.width ?? m.width ?? 0,
				height: size?.height ?? m.height ?? 0,
				alt: m.alt ?? '',
				caption: m.caption ?? '',
				title: m.title ?? '',
				link: m.link ?? '',
				filename: m.filename ?? '',
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
